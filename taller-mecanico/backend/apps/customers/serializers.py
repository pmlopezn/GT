from rest_framework import serializers
from .models import Customer, Vehicle, VehicleBrand
import unicodedata


def normalize_vehicle_type(value):
    """Lowercase and strip accents so 'automóvil' -> 'automovil'."""
    if not value:
        return value
    return unicodedata.normalize("NFD", str(value).lower()).encode("ascii", "ignore").decode("ascii")


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_vehicle_type(self, value):
        return normalize_vehicle_type(value)


class VehicleBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleBrand
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        return str(value).strip()


class CustomerSerializer(serializers.ModelSerializer):
    vehicles = VehicleSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class CustomerListSerializer(serializers.ModelSerializer):
    vehicle_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ["id", "ci_nit", "first_name", "last_name", "phone", "email", "address", "vehicle_count", "created_at"]

    def get_vehicle_count(self, obj):
        return obj.vehicles.count()
