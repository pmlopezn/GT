from django.db import migrations

BASE_BRANDS = [
    "Toyota", "Nissan", "Suzuki", "Honda", "Chevrolet", "Ford",
    "Volkswagen", "BMW", "Mercedes-Benz", "Hyundai", "Kia",
    "Mazda", "Mitsubishi", "Renault", "Peugeot", "Fiat",
    "Jeep", "Dodge", "Subaru", "Volvo", "Audi", "Lexus",
    "Jaguar", "Land Rover", "Mini", "Porsche",
    "Acura", "Alfa Romeo", "Aston Martin", "Bentley", "Buick",
    "Cadillac", "Chery", "Chrysler", "Citroën", "Dacia",
    "Daewoo", "Daihatsu", "Ferrari", "GAC", "Geely", "GMC",
    "Great Wall", "Haval", "Hummer", "Infiniti", "Isuzu",
    "Iveco", "JAC", "Lamborghini", "Lancia", "Lincoln",
    "Lotus", "Maserati", "McLaren", "MG", "Morris", "Opel",
    "Rolls-Royce", "Saab", "SEAT", "Škoda", "Smart",
    "SsangYong", "Tesla", "Vauxhall",
]


def seed_brands(apps, schema_editor):
    VehicleBrand = apps.get_model("customers", "VehicleBrand")
    Vehicle = apps.get_model("customers", "Vehicle")
    brands = set(BASE_BRANDS)
    for raw in Vehicle.objects.exclude(brand="").values_list("brand", flat=True).distinct():
        brands.add(str(raw).strip().title())
    for name in sorted(brands):
        VehicleBrand.objects.get_or_create(name=name, defaults={"is_active": True})


def unseed_brands(apps, schema_editor):
    VehicleBrand = apps.get_model("customers", "VehicleBrand")
    VehicleBrand.objects.filter(name__in=BASE_BRANDS).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0007_vehiclebrand"),
    ]

    operations = [
        migrations.RunPython(seed_brands, unseed_brands),
    ]
