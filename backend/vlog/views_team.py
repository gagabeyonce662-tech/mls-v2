"""Team management for the Blog Studio.

Deliberately guarded by `IsStaffUser`, a higher bar than the `CanAuthorPosts`
used for posts: a writer may publish articles but must not be able to hand
authoring rights to anyone else. Privilege escalation is the one thing a
content tool should never make easy.
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsStaffUser


User = get_user_model()


class TeamMemberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "name", "email", "is_staff", "can_author", "date_joined")

    def get_name(self, obj) -> str:
        return obj.full_name or obj.email


class StudioTeamView(APIView):
    """GET  /api/vlog/team/  — list everyone who can reach the Studio
    POST /api/vlog/team/  — grant authoring rights to an existing user
    """

    permission_classes = [IsStaffUser]

    @extend_schema(
        summary="List Studio team members",
        responses={200: TeamMemberSerializer(many=True)},
    )
    def get(self, request):
        members = User.objects.filter(
            is_staff=True
        ) | User.objects.filter(can_author=True)
        members = members.distinct().order_by("-is_staff", "email")
        return Response(TeamMemberSerializer(members, many=True).data)

    @extend_schema(
        summary="Grant Studio access to a user by email",
        request=inline_serializer(
            name="StudioTeamGrantRequest",
            fields={"email": serializers.EmailField()},
        ),
        responses={
            200: TeamMemberSerializer,
            400: OpenApiResponse(description="Email missing or malformed."),
            404: OpenApiResponse(description="No account with that email."),
        },
    )
    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"error": "An email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Deliberately explicit rather than silently creating an account:
            # inventing a user from a typo'd address is worse than a clear error,
            # and the person still needs to complete the normal signup + email
            # verification flow before they can log in at all.
            return Response(
                {
                    "error": (
                        "No account uses that email yet. Ask them to sign up "
                        "first, then grant access here."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        user.can_author = True
        user.save(update_fields=["can_author"])
        return Response(TeamMemberSerializer(user).data)


class StudioTeamMemberView(APIView):
    """DELETE /api/vlog/team/<int:user_id>/ — revoke authoring rights."""

    permission_classes = [IsStaffUser]

    @extend_schema(
        summary="Revoke a user's Studio access",
        responses={
            204: OpenApiResponse(description="Access revoked."),
            400: OpenApiResponse(description="Cannot revoke this user."),
            404: OpenApiResponse(description="No such user."),
        },
    )
    def delete(self, request, user_id: int):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "No such user."}, status=status.HTTP_404_NOT_FOUND
            )

        if user.pk == request.user.pk:
            return Response(
                {"error": "You can't remove your own access."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # `is_staff` is granted in Django admin and carries far more than Studio
        # access, so removing it is not this endpoint's job — say so plainly
        # instead of appearing to succeed while the user keeps getting in.
        if user.is_staff and not user.can_author:
            return Response(
                {
                    "error": (
                        "This user has Studio access through staff privileges. "
                        "Change that in Django admin."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.can_author = False
        user.save(update_fields=["can_author"])
        return Response(status=status.HTTP_204_NO_CONTENT)
