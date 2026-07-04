from django.db import models
from apps.accounts.models import User


class Employee(models.Model):
    ci = models.CharField(max_length=50, default="", verbose_name="CI")
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employee_profile")
    phone = models.CharField(max_length=20, blank=True)
    position = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Empleado"
        verbose_name_plural = "Empleados"

    def __str__(self):
        return self.user.get_full_name() or self.user.username
