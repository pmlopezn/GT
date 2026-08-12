import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0006_alter_vehicle_vehicle_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="VehicleBrand",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=50, unique=True, verbose_name="Nombre")),
                ("is_active", models.BooleanField(default=True, verbose_name="Activo")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Marca de vehículo",
                "verbose_name_plural": "Marcas de vehículos",
                "ordering": ["name"],
            },
        ),
    ]
