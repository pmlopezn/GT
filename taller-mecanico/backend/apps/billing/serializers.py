from rest_framework import serializers
from django.db.models import Sum
from .models import Invoice, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["id", "paid_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    work_order_id = serializers.IntegerField(source="work_order.id", read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ["work_order", "customer", "subtotal", "tax", "total", "notes"]


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["invoice", "amount", "method", "reference", "notes"]

    def create(self, validated_data):
        payment = Payment.objects.create(**validated_data)
        invoice = payment.invoice
        total_paid = invoice.payments.aggregate(total=Sum("amount"))["total"] or 0
        invoice.paid_amount = total_paid
        if total_paid >= invoice.total:
            invoice.status = Invoice.Status.PAID
        elif total_paid > 0:
            invoice.status = Invoice.Status.PARTIAL
        invoice.save(update_fields=["paid_amount", "status"])
        return payment
