from rest_framework import serializers
from .models import ServiceCategory, Service, ServiceVehiclePrice


class ServiceVehiclePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceVehiclePrice
        fields = ["id", "vehicle_type", "price", "vehicle_type_display"]
        read_only_fields = ["id"]
        extra_kwargs = {"vehicle_type": {"required": True}}

    vehicle_type_display = serializers.SerializerMethodField()

    VEHICLE_TYPE_DISPLAY = {
        'automovil': 'Automóvil',
        'vagoneta': 'Vagoneta',
        'camioneta': 'Camioneta',
        'camion': 'Camión',
        'trufi': 'Trufi',
        'micro': 'Micro',
    }

    def get_vehicle_type_display(self, obj):
        return self.VEHICLE_TYPE_DISPLAY.get(obj.vehicle_type, obj.vehicle_type)


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    vehicle_prices = ServiceVehiclePriceSerializer(many=True, required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = Service
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        prices_data = validated_data.pop("vehicle_prices", [])
        service = Service.objects.create(**validated_data)
        for item in prices_data:
            ServiceVehiclePrice.objects.create(service=service, **item)
        return service

    def update(self, instance, validated_data):
        prices_data = validated_data.pop("vehicle_prices", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if prices_data is not None:
            instance.vehicle_prices.all().delete()
            for item in prices_data:
                ServiceVehiclePrice.objects.create(service=instance, **item)
        return instance


class ServiceCategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = "__all__"
        read_only_fields = ["id", "created_at"]