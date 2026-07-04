from django.contrib import admin
from .models import WorkOrder, WorkOrderService, WorkOrderProduct, VehicleInspection

admin.site.register(WorkOrder)
admin.site.register(WorkOrderService)
admin.site.register(WorkOrderProduct)
admin.site.register(VehicleInspection)
