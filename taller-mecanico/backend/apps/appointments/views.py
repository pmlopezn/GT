from rest_framework import viewsets
from .models import Appointment
from .serializers import AppointmentSerializer
from apps.accounts.permissions import IsAdmin


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related(
        "customer", "vehicle", "employee__user"
    ).all()
    permission_classes = [IsAdmin]
    serializer_class = AppointmentSerializer
    search_fields = ["customer__first_name", "customer__last_name", "vehicle__plate"]
    filterset_fields = ["status", "employee", "date"]
    ordering_fields = ["date", "time"]
