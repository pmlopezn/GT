"""
Setup script: waits for DB, applies migrations, seeds data if empty.
Usage: python setup.py
"""
import os
import sys
import time
import psycopg2
from urllib.parse import urlparse

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


def wait_for_db():
    url = os.environ["DATABASE_URL"]
    result = urlparse(url)
    user = result.username
    password = result.password
    host = result.hostname
    port = result.port or 5432
    dbname = result.path.lstrip("/")
    for i in range(30):
        try:
            conn = psycopg2.connect(
                dbname=dbname, user=user, password=password, host=host, port=port
            )
            conn.close()
            print("Database is ready!")
            return
        except psycopg2.OperationalError as e:
            print(f"Waiting for database... ({i+1}/30) - {e}")
            time.sleep(2)
    print("Database not ready after 60 seconds")
    sys.exit(1)


def seed():
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute("SELECT 1 FROM accounts_user WHERE username='admin'")
    if cursor.fetchone():
        print("Data already seeded, skipping")
        return

    from django.contrib.auth import get_user_model
    from apps.customers.models import Customer, Vehicle
    from apps.employees.models import Employee
    from apps.service_catalog.models import ServiceCategory, Service, ServiceVehiclePrice
    from apps.inventory.models import Category, Product
    from apps.suppliers.models import Supplier

    User = get_user_model()

    admin = User.objects.create_superuser("admin", "admin@taller.com", "admin123", role="admin", first_name="Admin", last_name="Sistema")
    mec1 = User.objects.create_user("mecanico1", "mec1@taller.com", "mec123", role="mechanic", first_name="Carlos", last_name="López")
    mec2 = User.objects.create_user("mecanico2", "mec2@taller.com", "mec123", role="mechanic", first_name="Pedro", last_name="Ramírez")
    rec = User.objects.create_user("recepcion", "rec@taller.com", "rec123", role="receptionist", first_name="María", last_name="García")
    print("Usuarios creados")

    Employee.objects.create(user=mec1, position="Mecánico Senior", specialization="Motores", salary=25000, commission_percentage=5)
    Employee.objects.create(user=mec2, position="Mecánico Junior", specialization="Transmisiones", salary=15000, commission_percentage=3)
    print("Empleados creados")

    c1 = Customer.objects.create(first_name="Juan", last_name="Pérez", phone="555-0101", email="juan@email.com")
    c2 = Customer.objects.create(first_name="Ana", last_name="Martínez", phone="555-0102", email="ana@email.com")
    c3 = Customer.objects.create(first_name="Roberto", last_name="Sánchez", phone="555-0103", email="roberto@email.com")
    print("Clientes creados")

    Vehicle.objects.create(customer=c1, plate="ABC-123", brand="Toyota", model="Corolla", year=2020, color="Blanco")
    Vehicle.objects.create(customer=c1, plate="DEF-456", brand="Honda", model="Civic", year=2022, color="Negro")
    Vehicle.objects.create(customer=c2, plate="GHI-789", brand="Nissan", model="Sentra", year=2021, color="Rojo")
    Vehicle.objects.create(customer=c3, plate="JKL-012", brand="Ford", model="Mustang", year=2023, color="Azul")
    print("Vehículos creados")

    cat_motor = ServiceCategory.objects.create(name="Motor", description="Servicios relacionados con el motor")
    cat_frenos = ServiceCategory.objects.create(name="Frenos", description="Sistema de frenos")
    cat_suspension = ServiceCategory.objects.create(name="Suspensión", description="Sistema de suspensión")
    cat_electrico = ServiceCategory.objects.create(name="Eléctrico", description="Sistema eléctrico")
    cat_mantenimiento = ServiceCategory.objects.create(name="Mantenimiento", description="Mantenimiento general")
    print("Categorías de servicios creadas")

    services = [
        Service.objects.create(category=cat_motor, name="Cambio de Aceite", estimated_time_minutes=30),
        Service.objects.create(category=cat_motor, name="Diagnóstico de Motor", estimated_time_minutes=60),
        Service.objects.create(category=cat_frenos, name="Cambio de Balatas", estimated_time_minutes=60),
        Service.objects.create(category=cat_frenos, name="Rectificado de Discos", estimated_time_minutes=90),
        Service.objects.create(category=cat_suspension, name="Alineación", estimated_time_minutes=45),
        Service.objects.create(category=cat_suspension, name="Balanceo", estimated_time_minutes=30),
        Service.objects.create(category=cat_electrico, name="Diagnóstico Eléctrico", estimated_time_minutes=60),
        Service.objects.create(category=cat_electrico, name="Cambio de Batería", estimated_time_minutes=20),
        Service.objects.create(category=cat_mantenimiento, name="Servicio Completo", estimated_time_minutes=180),
        Service.objects.create(category=cat_mantenimiento, name="Revisión General", estimated_time_minutes=120),
    ]
    print("Servicios creados")
    print("Precios por tipo de vehículo creados")

    cat_filtros = Category.objects.create(name="Filtros", description="Filtros de aceite, aire, etc.")
    cat_aceites = Category.objects.create(name="Aceites y Lubricantes")
    cat_frenos_p = Category.objects.create(name="Partes de Frenos")
    cat_electrico_p = Category.objects.create(name="Partes Eléctricas")
    print("Categorías de productos creadas")

    Product.objects.create(category=cat_filtros, name="Filtro de Aceite", sku="FA-001", stock=20, min_stock=5, purchase_price=35, sale_price=70)
    Product.objects.create(category=cat_filtros, name="Filtro de Aire", sku="FA-002", stock=15, min_stock=5, purchase_price=45, sale_price=90)
    Product.objects.create(category=cat_aceites, name="Aceite 20W50 4L", sku="AC-001", stock=10, min_stock=3, purchase_price=180, sale_price=350)
    Product.objects.create(category=cat_aceites, name="Aceite 10W40 4L", sku="AC-002", stock=8, min_stock=3, purchase_price=200, sale_price=380)
    Product.objects.create(category=cat_frenos_p, name="Balatas Delanteras", sku="FR-001", stock=5, min_stock=2, purchase_price=250, sale_price=500)
    Product.objects.create(category=cat_frenos_p, name="Balatas Traseras", sku="FR-002", stock=4, min_stock=2, purchase_price=230, sale_price=480)
    Product.objects.create(category=cat_electrico_p, name="Batería 12V", sku="EL-001", stock=3, min_stock=2, purchase_price=800, sale_price=1500)
    Product.objects.create(category=cat_electrico_p, name="Bujías (juego 4)", sku="EL-002", stock=6, min_stock=3, purchase_price=120, sale_price=240)
    print("Productos creados")

    Supplier.objects.create(company_name="Refaccionaría López", contact_name="Luis López", phone="555-1001")
    Supplier.objects.create(company_name="AutoPartes Express", contact_name="Sofía Ruiz", phone="555-1002")
    Supplier.objects.create(company_name="Lubricantes del Norte", contact_name="Jorge Hernández", phone="555-1003")
    print("Proveedores creados")

    print("\n¡Base de datos poblada exitosamente!")


if __name__ == "__main__":
    wait_for_db()
    from django.core.management import call_command
    import django
    django.setup()
    print("Running migrations...")
    call_command("migrate")
    seed()
    print("Setup complete")
