from rest_framework import viewsets, permissions
from .models import Customer, Vehicle
from .serializers import CustomerSerializer, CustomerListSerializer, VehicleSerializer
from apps.accounts.permissions import IsAdminOrReceptionist


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [IsAdminOrReceptionist]
    search_fields = ["first_name", "last_name", "phone", "email"]
    ordering_fields = ["last_name", "first_name", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CustomerListSerializer
        return CustomerSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    permission_classes = [IsAdminOrReceptionist]
    search_fields = ["plate", "brand", "model", "vin"]
    filterset_fields = ["customer"]

    def get_serializer_class(self):
        return VehicleSerializer
