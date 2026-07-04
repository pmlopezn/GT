from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.plate} - {obj.vehicle.brand} {obj.vehicle.model}"

    def get_employee_name(self, obj):
        if obj.employee:
            return obj.employee.user.get_full_name() or obj.employee.user.username
        return None
