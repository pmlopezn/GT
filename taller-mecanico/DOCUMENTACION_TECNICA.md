# GT Automotriz — Documentación Técnica

## 1. Resumen del Proyecto

Sistema de gestión integral para taller mecánico (GT Automotriz). Permite administrar clientes, vehículos, órdenes de trabajo, catálogo de servicios con precios por tipo de vehículo, inventario, facturación, empleados, agenda de citas y compras. Incluye control de acceso por roles (admin, recepcionista, mecánico).

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Python + Django + Django REST Framework | 5.x |
| Autenticación | SimpleJWT (access 8h, refresh 7d) | — |
| Documentación API | drf-spectacular (Swagger UI) | — |
| Frontend | React + TypeScript + Vite | 18 / 5.x |
| UI | Ant Design | 5.x |
| Estado / Datos | TanStack Query (React Query) | 5.x |
| HTTP Client | Axios (con interceptor de refresh) | — |
| PDF | jspdf + jspdf-autotable | 4.x / 5.x |
| Base de Datos | PostgreSQL 15 (producción) / SQLite (local) | — |
| Infraestructura | Docker Compose (db + backend + frontend) | — |
| Locale | es-mx, Zona horaria: America/Mexico_City | — |

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Vite)                   │
│            React + TypeScript + Ant Design           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Pages   │  │ Contexts │  │  services/api.ts   │  │
│  │ (13 pág) │  │  (Auth)  │  │  (Axios + refresh) │  │
│  └──────────┘  └──────────┘  └────────┬───────────┘  │
│                                       │              │
└───────────────────────────────────────┼──────────────┘
                                        │ Proxy /api
                                        │ (Vite: localhost:5173 → localhost:8000)
                                        │ (Docker: localhost:5173 → backend:8000)
                                        ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Django REST)                  │
│   11 apps modulares bajo backend/apps/              │
│                                                     │
│  ┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐   │
│  │accounts│ │customers│ │employees │ │service_  │   │
│  │ (auth) │ │ (C, V)  │ │  (E)     │ │ catalog  │   │
│  └────────┘ └─────────┘ └──────────┘ └──────────┘   │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐   │
│  │work_   │ │appointm. │ │inventory│ │suppliers │   │
│  │ orders │ │          │ │         │ │          │   │
│  └────────┘ └──────────┘ └─────────┘ └──────────┘   │
│  ┌──────────┐ ┌───────┐ ┌─────────┐                 │
│  │purchasing│ │billing│ │dashboard│                 │
│  └──────────┘ └───────┘ └─────────┘                 │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │  PostgreSQL / SQLite    │
          └─────────────────────────┘
```

---

## 4. Estructura de Directorios

```
taller-mecanico/
├── docker-compose.yml
├── AGENTS.md
├── DOCUMENTACION_TECNICA.md
├── backend/
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed_data.py
│   ├── setup.py          # Wait for DB → migrate → seed (idempotente, usado por Docker)
│   ├── wait_for_db.py    # Utilidad standalone para esperar PostgreSQL
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py / asgi.py
│   └── apps/
│       ├── accounts/       # Usuarios, JWT, roles
│       ├── appointments/   # Agenda de citas
│       ├── billing/        # Facturación y pagos
│       ├── customers/      # Clientes y vehículos
│       ├── dashboard/      # Estadísticas del panel
│       ├── employees/      # Empleados (mecánicos)
│       ├── inventory/      # Productos y categorías
│       ├── purchasing/     # Órdenes de compra
│       ├── service_catalog/# Servicios y precios x tipo
│       ├── suppliers/      # Proveedores
│       └── work_orders/    # Órdenes de trabajo + inspección
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── vite-env.d.ts
        ├── contexts/
        │   └── AuthContext.tsx
        ├── layouts/
        │   └── DashboardLayout.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── CustomersPage.tsx
        │   ├── VehiclesPage.tsx
        │   ├── EmployeesPage.tsx
        │   ├── ServicesPage.tsx
        │   ├── WorkOrdersPage.tsx
        │   ├── WorkOrderFormPage.tsx
        │   ├── VehicleInspectionCard.tsx
        │   ├── AppointmentsPage.tsx
        │   ├── ProductsPage.tsx
        │   ├── SuppliersPage.tsx
        │   ├── PurchaseOrdersPage.tsx
        │   └── InvoicesPage.tsx
        ├── utils/
        │   └── pdfReport.ts   # Generación de PDF con logo, membrete y tabla
        └── services/
            └── api.ts
```

---

## 5. Modelo de Datos

### 5.1 accounts.User (AbstractUser extendido)

| Campo | Tipo | Detalle |
|-------|------|---------|
| username | CharField | Único |
| password | CharField | Hash |
| first_name, last_name | CharField | |
| email | EmailField | |
| role | CharField(20) | `admin`, `mechanic`, `receptionist` |
| phone | CharField(20) | |
| is_active | BooleanField | default=True |

### 5.2 customers.Customer

| Campo | Tipo | Detalle |
|-------|------|---------|
| ci_nit | CharField(50) | CI o NIT (requerido) |
| first_name | CharField(100) | |
| last_name | CharField(100) | |
| phone | CharField(20) | |
| email | EmailField | |
| address | TextField | |
| notes | TextField | |

### 5.3 customers.Vehicle

| Campo | Tipo | Detalle |
|-------|------|---------|
| customer | FK → Customer | CASCADE |
| plate | CharField(20) | unique |
| vehicle_type | CharField(20) | Choices: `automovil`, `vagoneta`, `camioneta`, `camion`, `trufi`, `micro` |
| brand | CharField(30) | 27 marcas (Toyota, Nissan, Honda, etc.) |
| model | CharField(50) | |
| year | IntegerField | 1970–2026 |
| vin | CharField(17) | |
| color | CharField(30) | |

### 5.4 employees.Employee

| Campo | Tipo | Detalle |
|-------|------|---------|
| ci | CharField(50) | Requerido |
| user | O2O → User | CASCADE |
| phone | CharField(20) | |
| position | CharField(100) | Cargo (ej. Mecánico Senior) |
| specialization | CharField(200) | Especialidad (ej. Motores) |
| salary | Decimal(10,2) | |
| commission_percentage | Decimal(5,2) | default=0 |
| hire_date | DateField | |
| is_active | BooleanField | |

### 5.5 service_catalog.ServiceCategory

| Campo | Tipo |
|-------|------|
| name | CharField(100) |
| description | TextField |

### 5.6 service_catalog.Service

| Campo | Tipo | Detalle |
|-------|------|---------|
| category | FK → ServiceCategory | CASCADE |
| name | CharField(200) | |
| description | TextField | |
| estimated_time_minutes | IntegerField | default=60 |
| is_active | BooleanField | |

> El precio se define por tipo de vehículo en `ServiceVehiclePrice` (5.7). El campo `price` del modelo Service fue eliminado.

### 5.7 service_catalog.ServiceVehiclePrice

| Campo | Tipo | Detalle |
|-------|------|---------|
| service | FK → Service | CASCADE |
| vehicle_type | CharField(20) | Mismos choices que Vehicle |
| price | Decimal(10,2) | |
| **Meta** | unique_together | (service, vehicle_type) |

### 5.8 work_orders.WorkOrder

| Campo | Tipo | Detalle |
|-------|------|---------|
| customer | FK → Customer | PROTECT |
| vehicle | FK → Vehicle | PROTECT |
| assigned_to | FK → Employee | SET_NULL, null |
| status | CharField(20) | `pending`, `in_progress`, `completed`, `invoiced`, `cancelled` |
| description | TextField | |
| notes | TextField | |
| total | Decimal(12,2) | default=0 |
| completed_at | DateTimeField | null |

### 5.9 work_orders.WorkOrderService (intermedia)

| Campo | Tipo | Detalle |
|-------|------|---------|
| work_order | FK → WorkOrder | CASCADE |
| service | FK → Service | PROTECT |
| quantity | IntegerField | default=1 |
| price | Decimal(10,2) | Precio al momento de crear la OT |
| notes | TextField | |

### 5.10 work_orders.WorkOrderProduct (intermedia)

| Campo | Tipo | Detalle |
|-------|------|---------|
| work_order | FK → WorkOrder | CASCADE |
| product | FK → Product (inventory) | PROTECT |
| quantity | IntegerField | default=1 |
| price | Decimal(10,2) | |
| notes | TextField | |

### 5.11 work_orders.VehicleInspection

| Campo | Tipo | Detalle |
|-------|------|---------|
| work_order | O2O → WorkOrder | CASCADE |
| inspected_by | FK → Employee | SET_NULL |
| exterior_notes | TextField | |
| has_dents, has_scratches, has_rust, has_paint_damage, has_cracked_glass, has_missing_parts | BooleanField | |
| missing_parts_detail | TextField | |
| interior_notes | TextField | |
| has_damaged_seats, has_bad_odor, has_dashboard_warning | BooleanField | |
| dashboard_warning_detail | TextField | |
| tire_condition | TextField | |
| spare_tire_present, jack_present | BooleanField | |
| mileage_in | IntegerField | |
| fuel_level | CharField(20) | |
| documents_ok | BooleanField | |
| documents_notes | TextField | |
| customer_acknowledged | BooleanField | |

### 5.12 appointments.Appointment

| Campo | Tipo | Detalle |
|-------|------|---------|
| customer | FK → Customer | CASCADE |
| vehicle | FK → Vehicle | CASCADE |
| employee | FK → Employee | SET_NULL |
| status | CharField(20) | `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled` |
| date | DateField | |
| time | TimeField | |
| description | TextField | |
| notes | TextField | |

### 5.13 billing.Invoice

| Campo | Tipo | Detalle |
|-------|------|---------|
| work_order | O2O → WorkOrder | PROTECT |
| customer | FK → Customer | PROTECT |
| status | CharField(20) | `pending`, `paid`, `partial`, `cancelled` |
| subtotal | Decimal(12,2) | |
| tax | Decimal(12,2) | |
| total | Decimal(12,2) | |
| paid_amount | Decimal(12,2) | |
| notes | TextField | |

### 5.14 billing.Payment

| Campo | Tipo | Detalle |
|-------|------|---------|
| invoice | FK → Invoice | CASCADE |
| amount | Decimal(12,2) | |
| method | CharField(20) | `cash`, `card`, `transfer`, `other` |
| reference | CharField(100) | |
| paid_at | DateTimeField | auto_now_add |

### 5.15 inventory.Category y Product

**Category:** name (CharField), description (TextField)

**Product:**
| Campo | Tipo |
|-------|------|
| category | FK → Category (null) |
| name | CharField(200) |
| sku | CharField(50), unique |
| stock | IntegerField, default=0 |
| min_stock | IntegerField, default=5 |
| purchase_price | Decimal(10,2) |
| sale_price | Decimal(10,2) |
| is_active | BooleanField |

### 5.16 suppliers.Supplier

| Campo | Tipo |
|-------|------|
| company_name | CharField(200) |
| contact_name | CharField(100) |
| phone | CharField(20) |
| email | EmailField |
| address | TextField |
| is_active | BooleanField |

### 5.17 purchasing.PurchaseOrder y PurchaseOrderItem

**PurchaseOrder:**
| Campo | Tipo | Detalle |
|-------|------|---------|
| supplier | FK → Supplier | CASCADE |
| status | CharField(20) | `pending`, `sent`, `received`, `cancelled` |
| order_date | DateField | auto_now_add |
| received_date | DateField | null |
| total | Decimal(12,2) | |
| notes | TextField | |

**PurchaseOrderItem:**
| Campo | Tipo |
|-------|------|
| purchase_order | FK → PurchaseOrder |
| product | FK → Product |
| quantity | IntegerField |
| unit_price | Decimal(10,2) |
| received_quantity | IntegerField, default=0 |

---

## 6. API REST — Endpoints

### 6.1 Autenticación (`/api/auth/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/api/auth/login/` | Público | Login JWT (access + refresh) |
| POST | `/api/auth/login/refresh/` | Público | Refrescar token |
| GET/PATCH | `/api/auth/profile/` | Authenticated | Perfil del usuario |
| POST | `/api/auth/change-password/` | Authenticated | Cambiar contraseña |
| GET/POST | `/api/auth/users/` | Admin | CRUD de usuarios |
| GET/PUT/PATCH/DELETE | `/api/auth/users/<id>/` | Admin | CRUD de usuarios |

### 6.2 Clientes (`/api/customers/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/customers/` | Admin/Receptionist | Listar clientes |
| POST | `/api/customers/` | Admin/Receptionist | Crear cliente |
| GET/PUT/PATCH/DELETE | `/api/customers/<id>/` | Admin/Receptionist | CRUD cliente |

### 6.3 Vehículos (`/api/vehicles/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/vehicles/` | Admin/Receptionist | Listar vehículos |
| POST | `/api/vehicles/` | Admin/Receptionist | Crear vehículo |
| GET/PUT/PATCH/DELETE | `/api/vehicles/<id>/` | Admin/Receptionist | CRUD vehículo |

### 6.4 Empleados (`/api/employees/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/employees/` | Admin | Listar empleados |
| POST | `/api/employees/` | Admin | Crear empleado (crea User + Employee) |
| GET/PUT/PATCH/DELETE | `/api/employees/<id>/` | Admin | CRUD empleado |

### 6.5 Servicios (`/api/services/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/services/categories/` | Admin | Listar categorías |
| POST | `/api/services/categories/` | Admin | Crear categoría |
| GET/PUT/PATCH/DELETE | `/api/services/categories/<id>/` | Admin | CRUD categoría |
| GET | `/api/services/` | Admin | Listar servicios (incluye `vehicle_prices`) |
| POST | `/api/services/` | Admin | Crear servicio con precios por tipo de vehículo |
| GET/PUT/PATCH/DELETE | `/api/services/<id>/` | Admin | CRUD servicio |

### 6.6 Órdenes de Trabajo (`/api/work-orders/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/work-orders/` | Authenticated | Listar (mecánico solo ve sus OT asignadas) |
| POST | `/api/work-orders/` | Authenticated | Crear OT con `services_data` y `products_data` |
| GET/PUT/PATCH/DELETE | `/api/work-orders/<id>/` | Authenticated | CRUD OT |
| GET/PUT/PATCH | `/api/work-orders/<id>/inspection/` | Authenticated | Inspección de recepción (auto-crea si no existe) |
| POST | `/api/work-orders/<id>/change_status/` | Authenticated | Cambiar estado |

**Formato `services_data` / `products_data` (POST/PATCH):**
```json
{
  "customer": 3,
  "vehicle": 4,
  "assigned_to": 5,
  "total": 150.00,
  "services_data": [
    {"service": 21, "quantity": 1, "price": 100.00, "notes": ""}
  ],
  "products_data": [
    {"product": 1, "quantity": 1, "price": 50.00, "notes": ""}
  ]
}
```

### 6.7 Citas (`/api/appointments/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/appointments/` | Admin | Listar citas |
| POST | `/api/appointments/` | Admin | Crear cita |
| GET/PUT/PATCH/DELETE | `/api/appointments/<id>/` | Admin | CRUD cita |

### 6.8 Inventario (`/api/products/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/products/categories/` | Admin | Listar categorías |
| POST | `/api/products/categories/` | Admin | Crear categoría |
| GET/PUT/PATCH/DELETE | `/api/products/categories/<id>/` | Admin | CRUD categoría |
| GET | `/api/products/` | Admin | Listar productos |
| POST | `/api/products/` | Admin | Crear producto |
| GET/PUT/PATCH/DELETE | `/api/products/<id>/` | Admin | CRUD producto |

### 6.9 Proveedores (`/api/suppliers/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/suppliers/` | Admin | Listar proveedores |
| POST | `/api/suppliers/` | Admin | Crear proveedor |
| GET/PUT/PATCH/DELETE | `/api/suppliers/<id>/` | Admin | CRUD proveedor |

### 6.10 Órdenes de Compra (`/api/purchase-orders/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/purchase-orders/` | Admin | Listar |
| POST | `/api/purchase-orders/` | Admin | Crear |
| GET/PUT/PATCH/DELETE | `/api/purchase-orders/<id>/` | Admin | CRUD |

### 6.11 Facturación (`/api/invoices/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/invoices/` | Admin | Listar facturas |
| POST | `/api/invoices/` | Admin | Crear factura |
| GET/PUT/PATCH/DELETE | `/api/invoices/<id>/` | Admin | CRUD factura |

### 6.12 Pagos (`/api/payments/`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/payments/` | Admin | Listar pagos |
| POST | `/api/payments/` | Admin | Registrar pago |
| GET/PUT/PATCH/DELETE | `/api/payments/<id>/` | Admin | CRUD pago |

### 6.13 Dashboard (`/api/dashboard/`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/` | Retorna: `active_orders`, `today_appointments`, `monthly_income`, `monthly_orders`, `low_stock`, `orders_by_status`, `recent_orders` (10), `top_services` (5) |

### 6.14 Documentación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/schema/` | OpenAPI schema (YAML) |
| GET | `/api/docs/` | Swagger UI |

---

## 7. Autenticación y Permisos

### 7.1 JWT (SimpleJWT)

- **Login:** `POST /api/auth/login/` → devuelve `access` (8h) y `refresh` (7d)
- **Header:** `Authorization: Bearer <access_token>`
- **Refresh automático (frontend):** Axios interceptor detecta 401, intenta `POST /api/auth/login/refresh/`, si falla redirige a `/login`

### 7.2 Clases de Permiso

| Clase | Ubicación | Acceso |
|-------|-----------|--------|
| `IsAdmin` | `apps/accounts/permissions.py` | Solo `role=admin` |
| `IsAdminOrReceptionist` | `apps/accounts/permissions.py` | `role=admin` o `role=receptionist` |
| `IsAuthenticated` | DRF default | Cualquier usuario autenticado |

### 7.3 Asignación por App

| App | Permiso |
|-----|---------|
| customers, vehicles | `IsAdminOrReceptionist` |
| employees, services, inventory, suppliers, purchasing, billing, appointments | `IsAdmin` |
| work_orders | `IsAuthenticated` + filtro: mecánico solo ve órdenes asignadas a él |
| dashboard | `IsAuthenticated` |

### 7.4 Roles y Menú (Frontend)

| Menú | Admin | Recepcionista | Mecánico |
|------|-------|---------------|----------|
| Dashboard | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | |
| Vehículos | ✓ | ✓ | |
| Órdenes | ✓ | ✓ | ✓ (solo asignadas) |
| Agenda | ✓ | | |
| Servicios | ✓ | | |
| Inventario | ✓ | | |
| Proveedores | ✓ | | |
| Compras | ✓ | | |
| Facturación | ✓ | | |
| Empleados | ✓ | | |

---

## 8. Frontend

### 8.1 Routing (App.tsx)

```tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/work-orders/new" element={<WorkOrderFormPage />} />
          <Route path="/work-orders/:id" element={<WorkOrderFormPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
        </Route>
      </Route>
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### 8.2 AuthContext

- **Provider:** `AuthProvider` envuelve la app
- **Estado:** `User | null`, `loading: boolean`
- **Flujo:** Al cargar, si hay `access_token` en localStorage, valida con `GET /api/auth/profile/`
- **login(username, password):** POST login → almacena tokens → obtiene perfil
- **logout():** Limpia localStorage, redirige a `/login`

### 8.3 API Client (services/api.ts)

- **Base URL:** `/api`
- **Interceptor request:** Adjunta `Authorization: Bearer <token>`
- **Interceptor response:** En 401, intenta refresh. Si falla, redirige a `/login`

### 8.4 Patrón de Páginas

Cada página CRUD sigue el patrón:

```tsx
export default function XPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['x'],
    queryFn: () => api.get('/x/', { params: { page_size: 200 } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values) => api.post('/x/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['x'] }); ... }
  })

  // updateMutation, deleteMutation similar

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Nuevo</Button>
      <Table dataSource={data?.results || data} columns={columns} />
      <Modal title={editing ? 'Editar' : 'Nuevo'} open={open} ...>
        <Form form={form} onFinish={...}> ... </Form>
      </Modal>
    </div>
  )
}
```

---

## 9. Lógica de Negocio Clave

### 9.1 Precios de Servicio por Tipo de Vehículo

Cada servicio tiene precios diferentes según el tipo de vehículo:

```
Cambio de Balatas:
  Automóvil  → Bs. 100
  Vagoneta   → Bs. 130
  Camioneta  → Bs. 150
  Camión     → Bs. 200
  Trufi      → Bs. 120
  Micro      → Bs. 180
```

- **Modelo:** `ServiceVehiclePrice` con `unique_together = (service, vehicle_type)`
- **API:** Incluye `vehicle_prices` como lista anidable en el serializer de Service
- **Frontend (Servicios):** Formulario con 6 inputs de precio (uno por tipo de vehículo). Tooltip en tabla.
- **Frontend (Orden de Trabajo):** Al seleccionar un vehículo, se detecta su `vehicle_type`. Al agregar un servicio, el precio se autocompleta desde `ServiceVehiclePrice` correspondiente.

### 9.2 EmployeeSerializer — Creación Unificada User+Employee

El serializer de empleados acepta campos con sufijo `_input` para evitar colisiones:

```python
class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    first_name_input = serializers.CharField(write_only=True, source="first_name")
    last_name_input = serializers.CharField(write_only=True, source="last_name")
    role_input = serializers.ChoiceField(write_only=True, choices=Role.choices, source="role")
    email_input = serializers.EmailField(write_only=True, source="email")
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        # Crea User + Employee en una sola petición
        ...
```

### 9.3 Filtro de Órdenes por Rol de Mecánico

```python
class WorkOrderViewSet(ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "mechanic":
            qs = qs.filter(assigned_to__user=self.request.user)
        return qs
```

### 9.4 Inspección de Recepción (VehicleInspection)

- Relación OneToOne con WorkOrder
- Endpoint: `GET|PUT|PATCH /api/work-orders/{id}/inspection/`
- Auto-crea el registro si no existe al hacer GET
- 20+ campos para checklist visual: exterior (abolladuras, rayones, óxido, etc.), interior (asientos, olores), llantas, kilometraje, nivel combustible, documentos

### 9.5 Generación de Reportes PDF

Se utiliza `jspdf` + `jspdf-autotable` para generar reportes desde el frontend:

```tsx
// frontend/src/utils/pdfReport.ts
export async function generatePdfReport(opts: PdfReportOptions) {
  const doc = new jsPDF()
  const logo = await loadLogoBase64()   // fetch → blob → base64

  // Logo (35×28) en esquina superior izquierda
  doc.addImage(logo, 'PNG', margin, y, 35, 28)

  // Membrete corporativo (4 líneas)
  COMPANY.address.forEach(line => doc.text(line, margin, y))

  // Título centrado en rojo
  doc.text(opts.title, pageWidth / 2, y, { align: 'center' })

  // Metadatos: usuario, fecha, hora
  doc.text(meta, margin, y)

  // Tabla con autoTable (cabecera roja, filas alternadas)
  autoTable(doc, { head, body, startY: y })

  // Footer con copyright + número de página
  doc.save(`${opts.title}.pdf`)
}
```

- **Logo:** Se carga desde `public/gt_logo.png` vía `fetch()` y se convierte a base64
- **Empresa:** Configurada en constante `COMPANY` (nombre, dirección, footer)
- **Botón en cada página:** Cada list page importa `useAuth` + `generatePdfReport` y agrega un botón `<FilePdfOutlined>` en el header
- **Uso en 11 páginas:** Dashboard, Clientes, Vehículos, Empleados, Servicios, Órdenes, Citas, Productos, Proveedores, Compras, Facturación

### 9.6 Columna "Nro" Correlativa

Cada tabla Ant Design incluye como primera columna:

```tsx
{ title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 }
```

Renderiza el índice dentro de la página (no relacionado con el ID de la BD).

### 9.7 Conversión Moneda (Decimal → String)

Los campos `DecimalField` de Django REST se serializan como string por defecto. Para evitar errores en el frontend (`.toFixed()` no funciona en strings), se usa `coerce_to_string=False` en los serializers que lo requieren, y en el frontend todos los renders aplican `Number(v || 0)` antes de formatear.

---

## 10. Configuración de Entorno

### 10.1 Local (SQLite)

```powershell
# Terminal 1 - Backend
cd taller-mecanico/backend
$env:DATABASE_URL="sqlite:///db.sqlite3"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
Get-Content seed_data.py | python manage.py shell
python manage.py runserver

# Terminal 2 - Frontend
cd taller-mecanico/frontend
npm install
npm run dev
```

### 10.2 Docker (PostgreSQL)

```bash
docker-compose up --build
```

- **PostgreSQL** en `localhost:5432`
- **Backend** en `localhost:8000`
- **Frontend** en `localhost:5173` (proxy `/api` → `http://backend:8000`)

#### Flujo de Inicio (Docker)

1. `db` inicia PostgreSQL con healthcheck (`pg_isready`)
2. `backend` espera a que `db` esté healthy (`condition: service_healthy`)
3. `backend` ejecuta `python setup.py` que:
   - Espera conexión a PostgreSQL (máx. 30 intentos)
   - Corre `migrate`
   - Verifica si ya hay seed (consulta `SELECT 1 FROM accounts_user`)
   - Si no hay seed, ejecuta `seed_data.py`
4. `backend` inicia `runserver 0.0.0.0:8000`
5. `frontend` inicia Vite dev server en modo polling (`usePolling: true`)

### 10.3 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://taller_user:taller_pass_2026@localhost:5432/taller_mecanico` | Connexión a BD (si no comienza con `postgres://` usa SQLite) |
| `DEBUG` | `True` | Modo debug Django |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,backend` | Hosts permitidos |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8000` | Orígenes CORS |
| `API_PROXY_TARGET` | `http://localhost:8000` | Target del proxy de Vite |

---

## 11. Seed Data

Ejecutar con: `Get-Content seed_data.py | python manage.py shell`

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | admin123 | Administrador |
| `mecanico1` | mec123 | Mecánico |
| `recepcion` | rec123 | Recepcionista |

**Datos de prueba:**
- 2 empleados (Carlos Lopez - Mecánico Senior, Pedro Ramirez - Mecánico Junior)
- 3 clientes con 4 vehículos
- 5 categorías de servicio, 10 servicios
- 4 categorías de producto, 8 productos
- 3 proveedores

---

## 12. Docker Compose

```yaml
services:
  db:       # PostgreSQL 15, puerto 5432, healthcheck: pg_isready
  backend:  # Django en puerto 8000, command: python setup.py && python manage.py runserver 0.0.0.0:8000
  frontend: # Vite dev server en puerto 5173, server.watch.usePolling: true
```

- `pgdata` persiste PostgreSQL
- Volúmenes bind (`./backend:/app`, `./frontend:/app`) permiten hot-reload
- `node_modules` se preserva con volumen anónimo (`/app/node_modules`)
- La caché de Vite (`node_modules/.vite`) debe limpiarse si no detecta cambios: `docker exec taller-mecanico-frontend-1 sh -c "rm -rf /app/node_modules/.vite" && docker-compose restart frontend`

---

## 13. Convenciones de Código

- **Backend:** apps con nombres en snake_case (`work_orders`, `service_catalog`)
- **URLs:** guiones para endpoints (`/api/work-orders/`, `/api/purchase-orders/`)
- **Precios:** se muestran como `Bs. ` (Bolivianos) en el frontend
- **Módulos (apps) de Django:** 11 apps modulares bajo `backend/apps/`
- **Frontend:** Cada página es un componente autónomo con hooks de TanStack Query
- **PDF:** Utilidad centralizada en `src/utils/pdfReport.ts`; todas las list pages lo importan
- **Nro columna:** Siempre primera columna de toda tabla Ant Design, renderiza índice + 1
- **Vite + Docker:** `server.watch.usePolling: true` en `vite.config.ts` para detectar cambios en volúmenes montados
- **Configuración de agente:** Ver `AGENTS.md` para instrucciones de desarrollo asistido
