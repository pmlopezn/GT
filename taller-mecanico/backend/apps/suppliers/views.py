from rest_framework import viewsets
from .models import Supplier
from .serializers import SupplierSerializer
from apps.accounts.permissions import IsAdmin


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    permission_classes = [IsAdmin]
    serializer_class = SupplierSerializer
    search_fields = ["company_name", "contact_name", "phone", "email"]
