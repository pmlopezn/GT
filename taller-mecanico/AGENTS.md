# GT Automotriz — AGENTS.md

## Stack
- **Backend:** Django 5 / DRF / SimpleJWT. 11 apps under `backend/apps/`.
- **Frontend:** React 18 + TypeScript + Vite + Ant Design + TanStack Query.
- **DB:** PostgreSQL 15 (default); SQLite fallback if `DATABASE_URL` does not match `postgres://...`.
- **Infra:** Docker Compose (db + backend + frontend).

## Setup

```bash
# Docker (full stack)
docker-compose up --build

# Local backend (SQLite)
cd backend
$env:DATABASE_URL="sqlite:///db.sqlite3"
python manage.py migrate
python manage.py shell < seed_data.py   # PowerShell: Get-Content seed_data.py | python manage.py shell
python manage.py runserver

# Local frontend
cd frontend
npm install
npm run dev        # proxies /api -> http://backend:8000
npm run build      # tsc -b && vite build
```

## Key conventions

- **Custom user model:** `apps.accounts.User` (not `auth.User`). Roles: `admin`, `mechanic`, `receptionist`.
- **All API endpoints** live under `/api/*`. JWT auth required by default. Public only: login, refresh.
- **Spanish locale:** `es-mx`, tz `America/Mexico_City`.
- **Apps are named with underscores** (`work_orders`, `service_catalog`). URLs use hyphens (`/api/work-orders/`).
- **Vehicles** are a separate router under `apps/customers/vehicle_urls.py` mounted at `/api/vehicles/`.
- **Payments** are under `apps/billing/payment_urls.py` mounted at `/api/payments/` (separate router from invoices).
- **Dashboard** is a single `GET /api/dashboard/` endpoint (`apps/dashboard/views.py`).
- **VehicleInspection** model in `apps/work_orders/models.py` (OneToOne with WorkOrder). Endpoint: `GET|PUT|PATCH /api/work-orders/{id}/inspection/`. Auto-creates on first `GET` if not exists.
- **Vite proxy target** is configurable via env var `API_PROXY_TARGET` (default `http://localhost:8000`). Docker sets `http://backend:8000`.

## Test users (seeded)

| Username    | Password | Role          |
|-------------|----------|---------------|
| `admin`     | admin123 | Administrator |
| `mecanico1` | mec123   | Mechanic      |
| `recepcion` | rec123   | Receptionist  |

## API docs
`http://localhost:8000/api/docs/` (Swagger UI, enabled via drf-spectacular).

## Frontend

- **Auth:** JWT tokens stored in `localStorage` as `access_token` / `refresh_token`. Auto-refresh interceptor in `services/api.ts`.
- **Router:** All routes under `DashboardLayout` (sidebar). Protected by `PrivateRoute` wrapper.
- **Pattern:** Each page is a standalone component using `useQuery`/`useMutation` from TanStack Query. CRUD modals are inline, not separate files.
- **API client:** Axios instance at `services/api.ts` — always import from there, not raw axios.
