from rest_framework.permissions import BasePermission


def _role(request):
    # A Django superuser is always treated as admin, regardless of whatever
    # (or no) UserProfile.role happens to be set — a safety net so a
    # superuser can never get locked out of admin features.
    if getattr(request.user, 'is_superuser', False):
        return 'admin'
    try:
        return request.user.profile.role
    except Exception:
        return None


class IsVolunteerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and _role(request) is not None


class IsEditor(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and _role(request) in ('editor', 'admin')


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and _role(request) == 'admin'
