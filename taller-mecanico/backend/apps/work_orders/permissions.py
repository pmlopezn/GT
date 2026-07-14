from rest_framework.permissions import BasePermission


class CanCreateWorkOrder(BasePermission):
    def has_permission(self, request, view):
        if view.action != "create":
            return True
        return request.user.role in ("admin", "receptionist")


class CanAssignMechanic(BasePermission):
    def has_permission(self, request, view):
        if view.action != "assign_mechanic":
            return True
        return request.user.role in ("admin", "receptionist")


class CanChangeStatus(BasePermission):
    def has_permission(self, request, view):
        if view.action != "change_status":
            return True
        return request.user.role in ("admin", "receptionist", "mechanic")

    def has_object_permission(self, request, view, obj):
        if view.action != "change_status":
            return True
        new_status = request.data.get("status")
        role = request.user.role
        if role == "admin":
            return True
        if role == "receptionist":
            return obj.status == "completed" and new_status == "invoiced" or \
                   obj.status == "pending" and new_status == "cancelled" or \
                   obj.status == "in_progress" and new_status == "pending"
        if role == "mechanic":
            return obj.assigned_to and obj.assigned_to.user == request.user and \
                   obj.status == "in_progress" and new_status == "completed"
        return False
