from rest_framework import viewsets
from .models import ServiceCategory, Service
from .serializers import ServiceCategorySerializer, ServiceSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrReadOnly


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.prefetch_related("services").all()
    permission_classes = [IsAdmin]
    serializer_class = ServiceCategorySerializer
    search_fields = ["name"]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related("category").prefetch_related("vehicle_prices").all()
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = ServiceSerializer
    search_fields = ["name", "description"]
    filterset_fields = ["category", "is_active"]
