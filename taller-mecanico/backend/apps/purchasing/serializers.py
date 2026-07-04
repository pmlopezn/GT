from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"
        read_only_fields = ["id"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.company_name", read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items_data = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = ["supplier", "status", "notes", "total", "items_data"]

    def create(self, validated_data):
        items_data = validated_data.pop("items_data", [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item)
        return po
