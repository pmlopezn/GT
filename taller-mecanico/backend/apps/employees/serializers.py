from rest_framework import serializers
from .models import Employee
from apps.accounts.models import User


class EmployeeSerializer(serializers.ModelSerializer):
    ci = serializers.CharField(required=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    first_name_input = serializers.CharField(write_only=True, required=False)
    last_name_input = serializers.CharField(write_only=True, required=False)
    role_input = serializers.ChoiceField(choices=User.Role.choices, write_only=True, required=False)
    email_input = serializers.EmailField(write_only=True, required=False)

    username_display = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "user"]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def create(self, validated_data):
        user_data = {
            "username": validated_data.pop("username"),
            "first_name": validated_data.pop("first_name_input", ""),
            "last_name": validated_data.pop("last_name_input", ""),
            "role": validated_data.pop("role_input", User.Role.RECEPTIONIST),
            "email": validated_data.pop("email_input", ""),
        }
        password = validated_data.pop("password", None)
        user = User(**user_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        employee = Employee.objects.create(user=user, **validated_data)
        return employee

    def update(self, instance, validated_data):
        user_data = {
            "first_name": validated_data.pop("first_name_input", None),
            "last_name": validated_data.pop("last_name_input", None),
            "role": validated_data.pop("role_input", None),
            "email": validated_data.pop("email_input", None),
        }
        password = validated_data.pop("password", None)
        user_data = {k: v for k, v in user_data.items() if v is not None}
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            if password:
                instance.user.set_password(password)
            instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
