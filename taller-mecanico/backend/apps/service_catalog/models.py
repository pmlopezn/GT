from django.db import models
from apps.customers.models import Vehicle


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Categoría de servicio"
        verbose_name_plural = "Categorías de servicios"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.CASCADE, related_name="services"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    estimated_time_minutes = models.IntegerField(default=60)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class ServiceVehiclePrice(models.Model):
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="vehicle_prices"
    )
    vehicle_type = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("service", "vehicle_type")
        verbose_name = "Precio por tipo de vehículo"
        verbose_name_plural = "Precios por tipo de vehículo"

    def __str__(self):
        return f"{self.service.name} - {self.vehicle_type}: ${self.price}"
