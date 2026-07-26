from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import UserProfile
from .permissions import IsAdmin

VALID_ROLES = ('admin', 'editor', 'volunteer')
# Unambiguous charset for generated passwords — no 0/O/1/l/I confusion.
PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'


class UserListView(APIView):
    """GET  /api/v1/admin/users/  — admin only, list existing users (shared
    across every project — one login, one user list).
    POST /api/v1/admin/users/  — admin only, create a new user + role.
    Generates a random password and returns it once in the response — it's
    never stored in plaintext and can't be retrieved again after this."""
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.select_related('profile').order_by('email')
        data = []
        for user in users:
            try:
                role = user.profile.role
                picture = user.profile.google_picture or ''
            except UserProfile.DoesNotExist:
                role = None
                picture = ''
            if user.is_superuser:
                role = 'admin'
            data.append({
                'id': user.id,
                'email': user.email,
                'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
                'role': role,
                'picture': picture,
                'is_active': user.is_active,
            })
        return Response(data)

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        role = request.data.get('role') or 'volunteer'
        name = (request.data.get('name') or '').strip()

        if not email:
            return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)
        if role not in VALID_ROLES:
            return Response({'error': f'role must be one of {VALID_ROLES}'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists():
            return Response({'error': f'A user with email "{email}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

        first_name, _, last_name = name.partition(' ')
        password = get_random_string(12, allowed_chars=PASSWORD_CHARS)

        user = User.objects.create_user(
            username=email, email=email, password=password,
            first_name=first_name, last_name=last_name,
        )
        UserProfile.objects.create(user=user, role=role)

        return Response({
            'id': user.id,
            'email': user.email,
            'role': role,
            'is_active': user.is_active,
            'password': password,
        }, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """PATCH /api/v1/admin/users/<id>/  — admin only"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role and new_role not in VALID_ROLES:
            return Response({'error': f'role must be one of {VALID_ROLES}'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'volunteer'})
        if new_role:
            profile.role = new_role
            profile.save(update_fields=['role'])

        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
            user.save(update_fields=['is_active'])

        return Response({
            'id': user.id,
            'email': user.email,
            'role': profile.role,
            'is_active': user.is_active,
        })
