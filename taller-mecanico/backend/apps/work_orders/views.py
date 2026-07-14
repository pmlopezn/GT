from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import WorkOrder, VehicleInspection
from .serializers import (
    WorkOrderListSerializer, WorkOrderDetailSerializer,
    WorkOrderCreateSerializer, WorkOrderServiceSerializer, WorkOrderProductSerializer,
    VehicleInspectionSerializer,
)
from .models import WorkOrderService, WorkOrderProduct
from .permissions import CanCreateWorkOrder, CanAssignMechanic, CanChangeStatus
from apps.employees.models import Employee


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related(
        "customer", "vehicle", "assigned_to__user"
    ).prefetch_related("services__service", "products__product", "inspection").all()
    permission_classes = [permissions.IsAuthenticated, CanCreateWorkOrder, CanAssignMechanic, CanChangeStatus]
    search_fields = ["customer__first_name", "customer__last_name", "vehicle__plate"]
    filterset_fields = ["status", "assigned_to", "customer", "vehicle"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "mechanic":
            qs = qs.filter(assigned_to__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return WorkOrderListSerializer
        if self.action in ("create", "update", "partial_update"):
            return WorkOrderCreateSerializer
        return WorkOrderDetailSerializer

    def perform_create(self, serializer):
        serializer.save(assigned_to=None)

    @action(detail=True, methods=["post"])
    def assign_mechanic(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != WorkOrder.Status.PENDING:
            return Response({"error": "Solo se puede asignar mecánico a órdenes pendientes"}, status=status.HTTP_400_BAD_REQUEST)
        mechanic_id = request.data.get("mechanic_id")
        if not mechanic_id:
            return Response({"error": "Se requiere mechanic_id"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            mechanic = Employee.objects.get(id=mechanic_id, user__role="mechanic")
        except Employee.DoesNotExist:
            return Response({"error": "Mecánico no válido"}, status=status.HTTP_400_BAD_REQUEST)
        work_order.assigned_to = mechanic
        work_order.status = WorkOrder.Status.IN_PROGRESS
        work_order.save(update_fields=["assigned_to", "status"])
        return Response({"status": work_order.status, "assigned_to": mechanic.id, "assigned_to_name": str(mechanic)})

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        work_order = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(WorkOrder.Status.choices):
            return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)
        role = request.user.role
        if role == "mechanic":
            if not (work_order.assigned_to and work_order.assigned_to.user == request.user):
                return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
            if not (work_order.status == "in_progress" and new_status == "completed"):
                return Response({"error": "El mecánico solo puede completar órdenes en progreso"}, status=status.HTTP_403_FORBIDDEN)
        elif role == "receptionist":
            if not ((work_order.status == "completed" and new_status == "invoiced") or
                    (work_order.status == "pending" and new_status == "cancelled") or
                    (work_order.status == "in_progress" and new_status == "pending")):
                return Response({"error": "Transición no permitida para recepcionista"}, status=status.HTTP_403_FORBIDDEN)
        work_order.status = new_status
        if new_status == WorkOrder.Status.COMPLETED:
            work_order.completed_at = timezone.now()
        work_order.save(update_fields=["status", "completed_at"])
        return Response({"status": new_status})

    @action(detail=True, methods=["post"])
    def add_service(self, request, pk=None):
        work_order = self.get_object()
        role = request.user.role
        if role == "mechanic":
            if not (work_order.assigned_to and work_order.assigned_to.user == request.user):
                return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
            if work_order.status not in ("in_progress", "pending"):
                return Response({"error": "No se puede agregar servicios en este estado"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = WorkOrderServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(work_order=work_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def add_product(self, request, pk=None):
        work_order = self.get_object()
        role = request.user.role
        if role == "mechanic":
            if not (work_order.assigned_to and work_order.assigned_to.user == request.user):
                return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
            if work_order.status not in ("in_progress", "pending"):
                return Response({"error": "No se puede agregar productos en este estado"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = WorkOrderProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(work_order=work_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "put", "patch"])
    def inspection(self, request, pk=None):
        work_order = self.get_object()
        inspection, created = VehicleInspection.objects.get_or_create(work_order=work_order)
        if request.method == "GET":
            serializer = VehicleInspectionSerializer(inspection)
            return Response(serializer.data)
        serializer = VehicleInspectionSerializer(
            inspection, data=request.data, partial=request.method == "PATCH"
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
