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


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related(
        "customer", "vehicle", "assigned_to__user"
    ).prefetch_related("services__service", "products__product", "inspection").all()
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["customer__first_name", "customer__last_name", "vehicle__plate"]
    filterset_fields = ["status", "assigned_to", "customer"]

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

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        work_order = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(WorkOrder.Status.choices):
            return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)
        work_order.status = new_status
        if new_status == WorkOrder.Status.COMPLETED:
            work_order.completed_at = timezone.now()
        work_order.save(update_fields=["status", "completed_at"])
        return Response({"status": new_status})

    @action(detail=True, methods=["post"])
    def add_service(self, request, pk=None):
        work_order = self.get_object()
        serializer = WorkOrderServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(work_order=work_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def add_product(self, request, pk=None):
        work_order = self.get_object()
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
