from django.db import models


class Customer(models.Model):
    ci_nit = models.CharField(max_length=50, verbose_name="CI/NIT")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Vehicle(models.Model):
    class Type(models.TextChoices):
        AUTOMOVIL = "automovil", "Automóvil"
        VAGONETA = "vagoneta", "Vagoneta"
        CAMIONETA = "camioneta", "Camioneta"
        CAMION = "camion", "Camión"
        TRUFI = "trufi", "Trufi"
        MICRO = "micro", "Micro"

    class Brand(models.TextChoices):
        TOYOTA = "toyota", "Toyota"
        NISSAN = "nissan", "Nissan"
        SUZUKI = "suzuki", "Suzuki"
        HONDA = "honda", "Honda"
        CHEVROLET = "chevrolet", "Chevrolet"
        FORD = "ford", "Ford"
        VOLKSWAGEN = "volkswagen", "Volkswagen"
        BMW = "bmw", "BMW"
        MERCEDES_BENZ = "mercedes_benz", "Mercedes-Benz"
        HYUNDAI = "hyundai", "Hyundai"
        KIA = "kia", "Kia"
        MAZDA = "mazda", "Mazda"
        MITSUBISHI = "mitsubishi", "Mitsubishi"
        RENAULT = "renault", "Renault"
        PEUGEOT = "peugeot", "Peugeot"
        FIAT = "fiat", "Fiat"
        JEEP = "jeep", "Jeep"
        DODGE = "dodge", "Dodge"
        SUBARU = "subaru", "Subaru"
        VOLVO = "volvo", "Volvo"
        AUDI = "audi", "Audi"
        LEXUS = "lexus", "Lexus"
        JAGUAR = "jaguar", "Jaguar"
        LAND_ROVER = "land_rover", "Land Rover"
        MINI = "mini", "Mini"
        PORSCHE = "porsche", "Porsche"
        OTRO = "otro", "Otro"

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="vehicles"
    )
    plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(
        max_length=20, choices=Type.choices, default=Type.AUTOMOVIL, verbose_name="Tipo"
    )
    brand = models.CharField(max_length=30, choices=Brand.choices)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    vin = models.CharField(max_length=17, blank=True)
    color = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"
        ordering = ["plate"]

    def __str__(self):
        return f"{self.plate} - {self.brand} {self.model} ({self.year})"
