from django.db import models
from apps.suppliers.models import Supplier
from apps.inventory.models import Product


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        SENT = "sent", "Enviada"
        RECEIVED = "received", "Recibida"
        CANCELLED = "cancelled", "Cancelada"

    supplier = models.ForeignKey(
        Supplier, on_delete=models.CASCADE, related_name="purchase_orders"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    order_date = models.DateField(auto_now_add=True)
    received_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Orden de compra"
        verbose_name_plural = "Órdenes de compra"
        ordering = ["-created_at"]

    def __str__(self):
        return f"OC #{self.id} - {self.supplier.company_name}"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="purchase_items"
    )
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    received_quantity = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Artículo de compra"
        verbose_name_plural = "Artículos de compra"

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
