"""Permissions for the Blog Studio.

Studio access is deliberately decoupled from ``is_staff``. Before this module,
the only way to author a post was to be staff — which also grants the Django
admin, and with it the MLS tables and every user record. That is far more
authority than writing a blog post requires, so ``User.can_author`` exists to
grant exactly the one capability.

``is_staff`` still implies Studio access so existing admins are not locked out.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanAuthorPosts(BasePermission):
    """Allow users who may write blog posts: staff, or ``can_author=True``."""

    message = "You don't have access to the Blog Studio."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "can_use_studio", False)
        )


class CanAuthorPostsOrReadOnly(BasePermission):
    """Public reads; writes restricted to Studio users.

    Used for categories, whose list is consumed by the public blog filter chips
    while creation stays privileged.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, "user", None)
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "can_use_studio", False)
        )


class IsStaffUser(BasePermission):
    """Strictly staff — used for managing WHO may author.

    A writer must not be able to grant authoring rights to anyone else, so team
    management is a higher bar than post management.
    """

    message = "Only administrators can manage the team."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)
