from rest_framework import viewsets
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from apps.accounts.permissions import IsAdmin


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    permission_classes = [IsAdmin]
    serializer_class = CategorySerializer
    search_fields = ["name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    permission_classes = [IsAdmin]
    serializer_class = ProductSerializer
    search_fields = ["name", "sku", "description"]
    filterset_fields = ["category", "is_active"]
    ordering_fields = ["name", "stock", "created_at"]
