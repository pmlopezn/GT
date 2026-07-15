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

    light_medium_left_ok = models.BooleanField(default=True, verbose_name="Luz media izquierda")
    light_medium_right_ok = models.BooleanField(default=True, verbose_name="Luz media derecha")
    light_low_left_ok = models.BooleanField(default=True, verbose_name="Luz baja izquierda")
    light_low_right_ok = models.BooleanField(default=True, verbose_name="Luz baja derecha")
    light_high_left_ok = models.BooleanField(default=True, verbose_name="Luz alta izquierda")
    light_high_right_ok = models.BooleanField(default=True, verbose_name="Luz alta derecha")
    light_turn_left_ok = models.BooleanField(default=True, verbose_name="Luces de giro izquierda")
    light_turn_right_ok = models.BooleanField(default=True, verbose_name="Luces de giro derecha")
    light_plate_front_ok = models.BooleanField(default=True, verbose_name="Luz de placa adelante")
    light_plate_rear_ok = models.BooleanField(default=True, verbose_name="Luz de placa atrás")
    glass_windshield_ok = models.BooleanField(default=True, verbose_name="Parabrisas delantero")
    glass_rear_ok = models.BooleanField(default=True, verbose_name="Trasero")
    glass_left_front_ok = models.BooleanField(default=True, verbose_name="Vidrio puerta delantera izq.")
    glass_left_rear_ok = models.BooleanField(default=True, verbose_name="Vidrio puerta trasera izq.")
    glass_left_quarter_ok = models.BooleanField(default=True, verbose_name="Ventilete trasero izq.")
    glass_right_front_ok = models.BooleanField(default=True, verbose_name="Vidrio puerta delantera der.")
    glass_right_rear_ok = models.BooleanField(default=True, verbose_name="Vidrio puerta trasera der.")
    glass_right_quarter_ok = models.BooleanField(default=True, verbose_name="Ventilete trasero der.")
    glass_notes = models.TextField(blank=True, verbose_name="Notas de vidrios")
    exterior_antenna_ok = models.BooleanField(default=True, verbose_name="Antena de radio")
    exterior_mirror_left_ok = models.BooleanField(default=True, verbose_name="Espejo lateral izq.")
    exterior_mirror_right_ok = models.BooleanField(default=True, verbose_name="Espejo lateral der.")
    exterior_wiper_front_left_ok = models.BooleanField(default=True, verbose_name="Limpiaparabrisas del. izq.")
    exterior_wiper_front_right_ok = models.BooleanField(default=True, verbose_name="Limpiaparabrisas del. der.")
    exterior_wiper_rear_ok = models.BooleanField(default=True, verbose_name="Limpiaparabrisas trasero")
    exterior_wheel_cap_left_front_ok = models.BooleanField(default=True, verbose_name="Tapón rueda izq. del.")
    exterior_wheel_cap_left_rear_ok = models.BooleanField(default=True, verbose_name="Tapón rueda izq. tras.")
    exterior_wheel_cap_right_front_ok = models.BooleanField(default=True, verbose_name="Tapón rueda der. del.")
    exterior_wheel_cap_right_rear_ok = models.BooleanField(default=True, verbose_name="Tapón rueda der. tras.")
    exterior_gas_cap_ok = models.BooleanField(default=True, verbose_name="Tapa de gasolina")
    exterior_plate_front_ok = models.BooleanField(default=True, verbose_name="Placa adelante")
    exterior_plate_rear_ok = models.BooleanField(default=True, verbose_name="Placa atrás")
    exterior_bumper_front_ok = models.BooleanField(default=True, verbose_name="Parachoque delantero")
    exterior_bumper_rear_ok = models.BooleanField(default=True, verbose_name="Parachoque trasero")
    exterior_dents_detail = models.TextField(blank=True, verbose_name="Abolladuras")
    exterior_scratches_detail = models.TextField(blank=True, verbose_name="Rayones")
    exterior_notes = models.TextField(blank=True)

    interior_radio_ok = models.BooleanField(default=True, verbose_name="Radio")
    interior_radio_cd_dvd = models.BooleanField(default=True, verbose_name="CD/DVD")
    interior_radio_screen = models.BooleanField(default=True, verbose_name="Pantalla")
    interior_cigarette_lighter_ok = models.BooleanField(default=True, verbose_name="Cigarrera")
    interior_horn_ok = models.BooleanField(default=True, verbose_name="Bocina")
    interior_rearview_mirror_ok = models.BooleanField(default=True, verbose_name="Retrovisor")
    interior_window_handle_lf_ok = models.BooleanField(default=True, verbose_name="Manija vidrio izq. del.")
    interior_window_handle_rf_ok = models.BooleanField(default=True, verbose_name="Manija vidrio der. del.")
    interior_window_handle_lr_ok = models.BooleanField(default=True, verbose_name="Manija vidrio izq. tras.")
    interior_window_handle_rr_ok = models.BooleanField(default=True, verbose_name="Manija vidrio der. tras.")
    interior_grab_handle_lf_ok = models.BooleanField(default=True, verbose_name="Sujetador izq. del.")
    interior_grab_handle_rf_ok = models.BooleanField(default=True, verbose_name="Sujetador der. del.")
    interior_grab_handle_lr_ok = models.BooleanField(default=True, verbose_name="Sujetador izq. tras.")
    interior_grab_handle_rr_ok = models.BooleanField(default=True, verbose_name="Sujetador der. tras.")
    interior_door_pull_lf_ok = models.BooleanField(default=True, verbose_name="Jalador izq. del.")
    interior_door_pull_rf_ok = models.BooleanField(default=True, verbose_name="Jalador der. del.")
    interior_door_pull_lr_ok = models.BooleanField(default=True, verbose_name="Jalador izq. tras.")
    interior_door_pull_rr_ok = models.BooleanField(default=True, verbose_name="Jalador der. tras.")
    interior_seatbelts_ok = models.BooleanField(default=True, verbose_name="Cinturones")
    interior_floor_ok = models.BooleanField(default=True, verbose_name="Pisos")
    interior_floor_type = models.CharField(max_length=20, blank=True, default="alfombra", verbose_name="Tipo piso")
    interior_floor_mats_ok = models.BooleanField(default=True, verbose_name="Tapetes")
    interior_seat_covers_front_ok = models.BooleanField(default=True, verbose_name="Fundas delanteras")
    interior_seat_covers_rear_ok = models.BooleanField(default=True, verbose_name="Fundas traseras")
    interior_spare_tire_ok = models.BooleanField(default=True, verbose_name="Llanta auxilio")
    interior_jack_ok = models.BooleanField(default=True, verbose_name="Gata")
    interior_extinguisher_ok = models.BooleanField(default=True, verbose_name="Extintor")
    interior_triangles_ok = models.BooleanField(default=True, verbose_name="Triángulos seguridad")
    interior_notes = models.TextField(blank=True)

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
