from rest_framework import viewsets
from .models import Invoice, Payment
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer,
    PaymentSerializer, PaymentCreateSerializer,
)
from apps.accounts.permissions import IsAdmin


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customer", "work_order").prefetch_related(
        "payments"
    ).all()
    permission_classes = [IsAdmin]
    filterset_fields = ["status", "customer"]
    search_fields = ["customer__first_name", "customer__last_name", "work_order__id"]

    def get_serializer_class(self):
        if self.action == "create":
            return InvoiceCreateSerializer
        return InvoiceSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return PaymentCreateSerializer
        return PaymentSerializer
