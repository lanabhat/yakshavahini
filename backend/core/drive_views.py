import secrets

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from googleapiclient.discovery import build as build_drive_service

from .models import DriveAccount
from .permissions import IsAdmin
from .drive_oauth import build_flow

OAUTH_STATE_CACHE_PREFIX = 'drive_oauth_state:'
OAUTH_STATE_TTL_SECONDS = 600  # 10 minutes


def _serialize_drive_account(acc):
    return {
        'id': acc.pk,
        'label': acc.label,
        'google_email': acc.google_email or '',
        'is_active': acc.is_active,
        'is_default': acc.is_default,
        'drive_folder_id': acc.drive_folder_id or '',
        'notes': acc.notes or '',
        'created_at': acc.created_at.isoformat(),
        'file_count': acc.files.count(),
    }


class DriveAccountListView(APIView):
    """
    GET  /api/v1/drive-accounts/  — list all configured Drive accounts
    POST /api/v1/drive-accounts/  — add a new one
         (multipart: label, service_account_file, is_default?, drive_folder_id?, notes?)
    Admin only. Shared across every project — Drive accounts aren't
    project-specific infrastructure.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        accounts = DriveAccount.objects.all()
        return Response([_serialize_drive_account(a) for a in accounts])

    def post(self, request):
        label = request.data.get('label')
        service_account_file = request.FILES.get('service_account_file')
        if not label or not service_account_file:
            return Response(
                {'error': 'label and service_account_file are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_default = str(request.data.get('is_default', '')).lower() == 'true'
        account = DriveAccount.objects.create(
            label=label,
            service_account_file=service_account_file,
            drive_folder_id=request.data.get('drive_folder_id', ''),
            notes=request.data.get('notes', ''),
            is_default=is_default,
        )
        if is_default:
            DriveAccount.objects.exclude(pk=account.pk).update(is_default=False)

        return Response(_serialize_drive_account(account), status=status.HTTP_201_CREATED)


class DriveAccountDetailView(APIView):
    """PATCH /api/v1/drive-accounts/<pk>/ { is_active?, is_default?, drive_folder_id?, notes? } — admin only"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            account = DriveAccount.objects.get(pk=pk)
        except DriveAccount.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_active' in request.data:
            account.is_active = bool(request.data['is_active'])
        if 'drive_folder_id' in request.data:
            account.drive_folder_id = request.data['drive_folder_id']
        if 'notes' in request.data:
            account.notes = request.data['notes']

        make_default = request.data.get('is_default')
        if make_default:
            DriveAccount.objects.exclude(pk=account.pk).update(is_default=False)
            account.is_default = True

        account.save()
        return Response(_serialize_drive_account(account))


class DriveOAuthStartView(APIView):
    """
    GET /api/v1/drive-accounts/oauth/start/ — admin only.
    Returns a Google authorization URL; the admin frontend does a full page
    redirect to it (window.location.href), the way any "Sign in with Google"
    flow works.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not settings.GOOGLE_DRIVE_OAUTH_CLIENT_ID or not settings.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET:
            return Response(
                {'error': 'Google Drive OAuth is not configured on the server yet.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        state = secrets.token_urlsafe(24)

        flow = build_flow()
        authorization_url, _ = flow.authorization_url(
            access_type='offline', include_granted_scopes='true', prompt='consent', state=state,
        )
        # Save the PKCE code_verifier alongside state — the callback rebuilds
        # a brand-new Flow object and needs it to complete the token exchange
        # (a fresh Flow has no memory of it otherwise).
        cache.set(
            f'{OAUTH_STATE_CACHE_PREFIX}{state}', flow.code_verifier, timeout=OAUTH_STATE_TTL_SECONDS,
        )
        return Response({'authorization_url': authorization_url})


class DriveOAuthCallbackView(APIView):
    """
    GET /api/v1/drive-accounts/oauth/callback/ — Google redirects the
    browser here directly after consent, with no Authorization header, so
    this endpoint is intentionally open (guarded by the one-time `state`
    token instead of a login check).
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        state = request.query_params.get('state')
        code = request.query_params.get('code')
        error = request.query_params.get('error')

        if error:
            return HttpResponse(
                f"<h3>Google sign-in was cancelled or failed: {error}</h3><p>You can close this tab.</p>"
            )

        cache_key = f'{OAUTH_STATE_CACHE_PREFIX}{state}' if state else None
        code_verifier = cache.get(cache_key) if cache_key else None
        if not code_verifier:
            return HttpResponse(
                "<h3>This connection link expired or was already used.</h3>"
                "<p>Go back to Drive Accounts and click \"Connect Google Account\" again.</p>",
                status=400,
            )
        cache.delete(cache_key)

        try:
            flow = build_flow(code_verifier=code_verifier)
            flow.fetch_token(code=code)
            creds = flow.credentials

            service = build_drive_service('drive', 'v3', credentials=creds, cache_discovery=False)
            about = service.about().get(fields='user').execute()
            email = about.get('user', {}).get('emailAddress') or 'Connected account'

            label = email
            suffix = 2
            while DriveAccount.objects.filter(label=label).exists():
                label = f'{email} ({suffix})'
                suffix += 1

            DriveAccount.objects.create(
                label=label,
                google_email=email,
                refresh_token=creds.refresh_token,
                is_default=not DriveAccount.objects.filter(is_active=True).exists(),
            )
        except Exception as e:
            return HttpResponse(
                f"<h3>Failed to connect: {e}</h3><p>You can close this tab and try again.</p>",
                status=500,
            )

        return HttpResponse(
            f"<h3>Connected {email}!</h3>"
            "<p>You can close this tab and go back to the Drive Accounts page — refresh it to see the new account.</p>"
        )
