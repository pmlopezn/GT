from rest_framework import serializers
from .models import WorkOrder, WorkOrderService, WorkOrderProduct, VehicleInspection


class WorkOrderServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = WorkOrderService
        fields = "__all__"
        read_only_fields = ["id", "work_order"]


class WorkOrderProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = WorkOrderProduct
        fields = "__all__"
        read_only_fields = ["id", "work_order"]


class VehicleInspectionSerializer(serializers.ModelSerializer):
    inspected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VehicleInspection
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_inspected_by_name(self, obj):
        if obj.inspected_by:
            return obj.inspected_by.user.get_full_name() or obj.inspected_by.user.username
        return None


class WorkOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = WorkOrder
        fields = [
            "id", "customer_name", "vehicle_info", "assigned_to_name",
            "status", "total", "created_at", "completed_at",
        ]

    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.plate} - {obj.vehicle.brand} {obj.vehicle.model}"

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.user.get_full_name() or obj.assigned_to.user.username
        return None


class WorkOrderDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_id = serializers.IntegerField(source="customer.id", read_only=True)
    vehicle_plate = serializers.CharField(source="vehicle.plate", read_only=True)
    vehicle_id = serializers.IntegerField(source="vehicle.id", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    services = WorkOrderServiceSerializer(many=True, read_only=True)
    products = WorkOrderProductSerializer(many=True, read_only=True)
    inspection = VehicleInspectionSerializer(read_only=True)

    class Meta:
        model = WorkOrder
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.user.get_full_name() or obj.assigned_to.user.username
        return None


class WorkOrderCreateSerializer(serializers.ModelSerializer):
    services_data = WorkOrderServiceSerializer(many=True, required=False)
    products_data = WorkOrderProductSerializer(many=True, required=False)

    class Meta:
        model = WorkOrder
        fields = [
            "id", "customer", "vehicle", "assigned_to", "status",
            "description", "notes", "total", "services_data", "products_data",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        services_data = validated_data.pop("services_data", [])
        products_data = validated_data.pop("products_data", [])
        work_order = WorkOrder.objects.create(**validated_data)
        for item in services_data:
            WorkOrderService.objects.create(work_order=work_order, **item)
        for item in products_data:
            WorkOrderProduct.objects.create(work_order=work_order, **item)
        return work_order

    def update(self, instance, validated_data):
        services_data = validated_data.pop("services_data", None)
        products_data = validated_data.pop("products_data", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services_data is not None:
            instance.services.all().delete()
            for item in services_data:
                WorkOrderService.objects.create(work_order=instance, **item)
        if products_data is not None:
            instance.products.all().delete()
            for item in products_data:
                WorkOrderProduct.objects.create(work_order=instance, **item)
        return instance
