from rest_framework import serializers
from .models import Customer, Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


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
