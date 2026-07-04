from django.db import models
from apps.customers.models import Customer, Vehicle
from apps.employees.models import Employee


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Programada"
        CONFIRMED = "confirmed", "Confirmada"
        IN_PROGRESS = "in_progress", "En Progreso"
        COMPLETED = "completed", "Completada"
        CANCELLED = "cancelled", "Cancelada"

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="appointments"
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="appointments"
    )
    employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )
    date = models.DateField()
    time = models.TimeField()
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"Cita {self.date} {self.time} - {self.customer.full_name}"
