from django.db import models
from apps.customers.models import Customer, Vehicle
from apps.employees.models import Employee
from apps.service_catalog.models import Service
from apps.inventory.models import Product


class VehicleInspection(models.Model):
    work_order = models.OneToOneField(
        "WorkOrder", on_delete=models.CASCADE, related_name="inspection"
    )
    inspected_by = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True
    )

    exterior_notes = models.TextField(blank=True)
    has_dents = models.BooleanField(default=False)
    has_scratches = models.BooleanField(default=False)
    has_rust = models.BooleanField(default=False)
    has_paint_damage = models.BooleanField(default=False)
    has_cracked_glass = models.BooleanField(default=False)
    has_missing_parts = models.BooleanField(default=False)
    missing_parts_detail = models.TextField(blank=True)

    interior_notes = models.TextField(blank=True)
    has_damaged_seats = models.BooleanField(default=False)
    has_bad_odor = models.BooleanField(default=False)
    has_dashboard_warning = models.BooleanField(default=False)
    dashboard_warning_detail = models.TextField(blank=True)

    tire_condition = models.TextField(blank=True)
    spare_tire_present = models.BooleanField(default=True)
    jack_present = models.BooleanField(default=True)

    mileage_in = models.IntegerField(null=True, blank=True)
    mileage_unit = models.CharField(max_length=10, blank=True, default='KM')
    fuel_level = models.CharField(max_length=20, blank=True)

    documents_ok = models.BooleanField(default=True)
    documents_notes = models.TextField(blank=True)

    customer_acknowledged = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Inspección de recepción"
        verbose_name_plural = "Inspecciones de recepción"

    def __str__(self):
        return f"Inspección OT #{self.work_order_id}"


class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        IN_PROGRESS = "in_progress", "En Progreso"
        COMPLETED = "completed", "Completado"
        INVOICED = "invoiced", "Facturado"
        CANCELLED = "cancelled", "Cancelado"

    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="work_orders"
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.PROTECT, related_name="work_orders"
    )
    assigned_to = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="work_orders"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Orden de trabajo"
        verbose_name_plural = "Órdenes de trabajo"
        ordering = ["-created_at"]

    def __str__(self):
        return f"OT #{self.id} - {self.vehicle.plate}"


class WorkOrderService(models.Model):
    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name="services"
    )
    service = models.ForeignKey(
        Service, on_delete=models.PROTECT, related_name="work_order_services"
    )
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Servicio de orden"
        verbose_name_plural = "Servicios de orden"

    def __str__(self):
        return f"{self.service.name} x{self.quantity}"


class WorkOrderProduct(models.Model):
    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name="products"
    )
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="work_order_products"
    )
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Producto de orden"
        verbose_name_plural = "Productos de orden"

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
