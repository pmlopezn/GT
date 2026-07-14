from rest_framework import viewsets, permissions
from .models import Employee
from .serializers import EmployeeSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrReceptionist


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user").all().order_by("id")
    serializer_class = EmployeeSerializer
    search_fields = ["user__first_name", "user__last_name", "position", "specialization"]
    filterset_fields = ["is_active", "user__role"]

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated(), IsAdminOrReceptionist()]
        return [permissions.IsAuthenticated(), IsAdmin()]
