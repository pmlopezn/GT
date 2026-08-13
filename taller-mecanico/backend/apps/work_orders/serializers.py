from rest_framework import serializers
import unicodedata
from django.utils import timezone
from .models import WorkOrder, WorkOrderService, WorkOrderProduct, VehicleInspection
from apps.service_catalog.models import ServiceVehiclePrice


def _normalize(v):
    return unicodedata.normalize("NFD", str(v or "").lower()).encode("ascii", "ignore").decode("ascii")


def _resolve_service_price(vehicle_type, service, client_price):
    """Return catalog price for the vehicle type; fallback to client price / service.price."""
    price = client_price
    service_id = service.id if service else None
    if price is None or float(price) <= 0:
        vt = _normalize(vehicle_type)
        match = None
        for p in ServiceVehiclePrice.objects.filter(service_id=service_id).all():
            if _normalize(p.vehicle_type) == vt:
                match = p
                break
        if match is not None:
            price = match.price
        elif service is not None and service.price is not None:
            price = service.price
    return price


def _resolve_product_price(product, client_price):
    price = client_price
    if price is None or float(price) <= 0:
        if product is not None and product.sale_price is not None:
            price = product.sale_price
    return price


def _recompute_total(work_order):
    total = 0
    for item in work_order.services.all():
        total += float(item.price or 0) * item.quantity
    for item in work_order.products.all():
        total += float(item.price or 0) * item.quantity
    work_order.total = round(total, 2)
    work_order.save(update_fields=["total"])
    return work_order.total


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
    assigned_to = serializers.IntegerField(source="assigned_to.id", read_only=True, allow_null=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = WorkOrder
        fields = [
            "id", "customer_name", "vehicle_info", "assigned_to_name", "assigned_to",
            "status", "total", "created_at", "assigned_at", "in_progress_at",
            "completed_at", "invoiced_at", "cancelled_at",
        ]

    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.plate} - {obj.vehicle.brand} {obj.vehicle.model}"

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.user.get_full_name() or obj.assigned_to.user.username
        return None


class WorkOrderDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)
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
        read_only_fields = [
            "id", "created_at", "updated_at",
            "assigned_at", "in_progress_at", "completed_at", "invoiced_at", "cancelled_at",
            "mechanic_observations",
            "checklist_fluids_ok", "checklist_caps_ok",
            "checklist_lug_nuts_ok", "checklist_fasteners_ok",
        ]

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
            "description", "notes", "reported_problem", "initial_diagnosis",
            "mechanic_observations",
            "checklist_fluids_ok", "checklist_caps_ok",
            "checklist_lug_nuts_ok", "checklist_fasteners_ok",
            "total", "services_data", "products_data",
        ]
        read_only_fields = ["id", "status"]

    def create(self, validated_data):
        services_data = validated_data.pop("services_data", [])
        products_data = validated_data.pop("products_data", [])
        vehicle_type = validated_data["vehicle"].vehicle_type if validated_data.get("vehicle") else None
        work_order = WorkOrder.objects.create(**validated_data)
        for item in services_data:
            item["price"] = _resolve_service_price(vehicle_type, item.get("service"), item.get("price"))
            WorkOrderService.objects.create(work_order=work_order, **item)
        for item in products_data:
            item["price"] = _resolve_product_price(item.get("product"), item.get("price"))
            WorkOrderProduct.objects.create(work_order=work_order, **item)
        _recompute_total(work_order)
        return work_order

    def update(self, instance, validated_data):
        services_data = validated_data.pop("services_data", None)
        products_data = validated_data.pop("products_data", None)
        if "assigned_to" in validated_data:
            validated_data["assigned_at"] = timezone.now()
        vehicle_type = instance.vehicle.vehicle_type if instance.vehicle else None
        if "vehicle" in validated_data and validated_data["vehicle"]:
            vehicle_type = validated_data["vehicle"].vehicle_type
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services_data is not None:
            instance.services.all().delete()
            for item in services_data:
                item["price"] = _resolve_service_price(vehicle_type, item.get("service"), item.get("price"))
                WorkOrderService.objects.create(work_order=instance, **item)
        if products_data is not None:
            instance.products.all().delete()
            for item in products_data:
                item["price"] = _resolve_product_price(item.get("product"), item.get("price"))
                WorkOrderProduct.objects.create(work_order=instance, **item)
        _recompute_total(instance)
        return instance
