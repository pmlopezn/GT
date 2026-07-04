from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PurchaseOrder, PurchaseOrderItem
from .serializers import (
    PurchaseOrderSerializer, PurchaseOrderCreateSerializer, PurchaseOrderItemSerializer
)
from apps.accounts.permissions import IsAdmin


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related("supplier").prefetch_related(
        "items__product"
    ).all()
    permission_classes = [IsAdmin]
    filterset_fields = ["status", "supplier"]
    search_fields = ["supplier__company_name", "notes"]

    def get_serializer_class(self):
        if self.action == "create":
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        po = self.get_object()
        if po.status != PurchaseOrder.Status.SENT:
            return Response(
                {"error": "Solo se pueden recibir órdenes en estado 'Enviada'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        items_data = request.data.get("items", [])
        for item_data in items_data:
            item_id = item_data.get("id")
            received_qty = item_data.get("received_quantity", 0)
            try:
                item = PurchaseOrderItem.objects.get(id=item_id, purchase_order=po)
                item.received_quantity = received_qty
                item.save(update_fields=["received_quantity"])
                product = item.product
                product.stock += received_qty
                product.save(update_fields=["stock"])
            except PurchaseOrderItem.DoesNotExist:
                pass
        po.status = PurchaseOrder.Status.RECEIVED
        po.received_date = timezone.now().date()
        po.save(update_fields=["status", "received_date"])
        return Response({"status": "received"})
