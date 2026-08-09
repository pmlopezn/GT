from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum, F
from django.utils import timezone
from apps.work_orders.models import WorkOrder, WorkOrderService
from apps.billing.models import Payment
from apps.appointments.models import Appointment
from apps.inventory.models import Product


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        user = request.user
        is_mechanic = user.role == "mechanic"

        if is_mechanic:
            orders = WorkOrder.objects.filter(assigned_to__user=user)
        else:
            orders = WorkOrder.objects.all()

        active_orders = orders.exclude(
            status__in=["completed", "invoiced", "cancelled"]
        ).count()

        today_appointments = Appointment.objects.filter(date=today).count()

        if is_mechanic:
            commission_percentage = getattr(getattr(user, "employee_profile", None), "commission_percentage", 0) or 0
            services_total = (
                WorkOrderService.objects.filter(
                    work_order__assigned_to__user=user,
                    work_order__status__in=["completed", "invoiced"],
                    work_order__completed_at__date__gte=start_of_month,
                ).aggregate(total=Sum(F("price") * F("quantity")))["total"] or 0
            )
            monthly_income = float(services_total) * float(commission_percentage) / 100
        else:
            monthly_income = Payment.objects.filter(
                paid_at__date__gte=start_of_month
            ).aggregate(total=Sum("amount"))["total"] or 0

        monthly_orders = orders.filter(
            created_at__date__gte=start_of_month
        ).count()

        low_stock = Product.objects.filter(stock__lte=F("min_stock")).count()

        orders_by_status = (
            orders.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        recent_orders = (
            orders.select_related("customer", "vehicle")
            .order_by("-created_at")[:10]
        )
        recent_orders_data = [
            {
                "id": o.id,
                "customer": o.customer.full_name,
                "vehicle": str(o.vehicle),
                "status": o.status,
                "total": float(o.total) if not is_mechanic else None,
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders
        ]

        top_services = (
            orders.filter(services__isnull=False)
            .values("services__service__name")
            .annotate(count=Count("services"))
            .order_by("-count")[:5]
        )
        top_services_data = [
            {"name": s["services__service__name"], "count": s["count"]}
            for s in top_services
        ]

        return Response({
            "active_orders": active_orders,
            "today_appointments": today_appointments,
            "monthly_income": float(monthly_income),
            "monthly_orders": monthly_orders,
            "low_stock": low_stock,
            "orders_by_status": list(orders_by_status),
            "recent_orders": recent_orders_data,
            "top_services": top_services_data,
            "is_mechanic": is_mechanic,
            "commission_percentage": float(getattr(getattr(user, "employee_profile", None), "commission_percentage", 0) or 0) if is_mechanic else 0,
        })
