from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import UserProfile


def _effective_role(user, profile_role):
    # A Django superuser is always treated as admin, regardless of whatever
    # (or no) UserProfile.role happens to be set.
    return 'admin' if user.is_superuser else profile_role


class AdminLoginView(APIView):
    """POST /api/auth/admin-login/  { username: "...", password: "..." }

    Simple username/password login for the admin app — decoupled from Google
    OAuth entirely. Only accounts with a role set via `set_admin_password` (or
    the Django admin) can meaningfully use this.
    """

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'volunteer'})
        drf_token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': drf_token.key,
            'email': user.email,
            'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
            'picture': profile.google_picture or '',
            'role': _effective_role(user, profile.role),
        })


class GoogleLoginView(APIView):
    """POST /api/auth/google/  { id_token: "..." }"""

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'error': 'id_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        if not client_id:
            return Response({'error': 'Google OAuth not configured on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            info = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        except ValueError as e:
            return Response({'error': f'Invalid token: {e}'}, status=status.HTTP_401_UNAUTHORIZED)

        email = info.get('email')
        if not email:
            return Response({'error': 'Token did not include email'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = info.get('given_name', '')
        last_name = info.get('family_name', '')
        picture = info.get('picture', '')

        user, _ = User.objects.get_or_create(
            username=email,
            defaults={'email': email, 'first_name': first_name, 'last_name': last_name},
        )
        if not user.email:
            user.email = email
            user.save(update_fields=['email'])

        profile, created = UserProfile.objects.get_or_create(user=user, defaults={'role': 'volunteer'})
        if picture and profile.google_picture != picture:
            profile.google_picture = picture
            profile.save(update_fields=['google_picture'])

        drf_token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': drf_token.key,
            'email': email,
            'name': f'{first_name} {last_name}'.strip(),
            'picture': picture,
            'role': _effective_role(user, profile.role),
        })


class MeView(APIView):
    """GET /api/auth/me/  — requires Token header"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            role = user.profile.role
            picture = user.profile.google_picture or ''
        except UserProfile.DoesNotExist:
            role = None
            picture = ''

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
            'picture': picture,
            'role': _effective_role(user, role),
        })
