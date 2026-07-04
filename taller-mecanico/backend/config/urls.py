from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/customers/", include("apps.customers.urls")),
    path("api/vehicles/", include("apps.customers.vehicle_urls")),
    path("api/employees/", include("apps.employees.urls")),
    path("api/services/", include("apps.service_catalog.urls")),
    path("api/work-orders/", include("apps.work_orders.urls")),
    path("api/appointments/", include("apps.appointments.urls")),
    path("api/products/", include("apps.inventory.urls")),
    path("api/suppliers/", include("apps.suppliers.urls")),
    path("api/purchase-orders/", include("apps.purchasing.urls")),
    path("api/invoices/", include("apps.billing.urls")),
    path("api/payments/", include("apps.billing.payment_urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
