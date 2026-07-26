"""Google Drive API v3 integration for file uploads — copied from the
Pratisangraha backend's drive_utils.py, generalized to build the filename
from a project's schema (title_field) instead of hardcoded prasanga/kavi.

Two credential paths per DriveAccount:
- OAuth refresh token (recommended) — a real Gmail account connected via the
  one-time "Connect Google Account" flow. Uploads count against that
  account's own Drive storage. This is the only path that works for a
  personal/free Google account — bare service accounts have zero storage
  quota of their own, even when a folder is shared with them.
- Service account JSON file — only works when `drive_folder_id` points at a
  Google Workspace Shared Drive.
"""
import re
import time

import requests
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials as UserCredentials
from google.auth.transport.requests import Request as GoogleAuthRequest
from googleapiclient.discovery import build
from django.conf import settings

from .models import DriveAccount

SERVICE_ACCOUNT_SCOPES = ['https://www.googleapis.com/auth/drive']
OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Google Drive itself allows very long names, but 255 chars (incl. extension)
# matches the common filesystem limit anything downloading the file is likely
# to hit, so we cap to that.
MAX_DRIVE_FILENAME_LENGTH = 255
_INVALID_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|]')


def _sanitize_filename_part(text):
    text = _INVALID_FILENAME_CHARS.sub('_', text or '')
    text = re.sub(r'\s+', '_', text.strip())
    return text.strip('_')


def build_drive_filename(schema, entry, user_file_name=None, extension='pdf'):
    """
    Filename = <entry_id>_<user-provided name>, or if the user left it blank,
    <entry_id>_<title> (title = the project's schema.title_field) — truncated
    (keeping the prefix intact) to stay under Drive/filesystem length limits.
    """
    prefix = entry.entry_id
    if user_file_name and user_file_name.strip():
        base = f'{prefix}_{_sanitize_filename_part(user_file_name)}'
    else:
        title = _sanitize_filename_part(getattr(entry, schema.title_field, '') or '')
        base = '_'.join(p for p in [prefix, title] if p)

    max_base_length = MAX_DRIVE_FILENAME_LENGTH - len(extension) - 1
    if len(base) > max_base_length:
        base = base[:max_base_length].rstrip('_')
    return f'{base}.{extension}'


def _get_drive_account(drive_account_id=None):
    if drive_account_id:
        return DriveAccount.objects.get(pk=drive_account_id, is_active=True)
    account = DriveAccount.objects.filter(is_active=True, is_default=True).first()
    if account is None:
        account = DriveAccount.objects.filter(is_active=True).first()
    if account is None:
        raise RuntimeError('No active Google Drive account configured.')
    return account


def _get_credentials(drive_account):
    if drive_account.refresh_token:
        creds = UserCredentials(
            None,
            refresh_token=drive_account.refresh_token,
            client_id=settings.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
            client_secret=settings.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
            token_uri='https://www.googleapis.com/oauth2/v4/token',
            scopes=OAUTH_SCOPES,
        )
        creds.refresh(GoogleAuthRequest())
    else:
        creds = service_account.Credentials.from_service_account_file(
            drive_account.service_account_file.path, scopes=SERVICE_ACCOUNT_SCOPES,
        )
    return creds


def _build_service(drive_account):
    return build('drive', 'v3', credentials=_get_credentials(drive_account), cache_discovery=False)


def start_resumable_upload_session(schema, entry, user_file_name, drive_account_id=None):
    """Opens a Drive resumable-upload session and returns
    (drive_account, access_token, upload_url, file_name) — the browser then
    PUTs the file bytes directly to upload_url, so Django never touches them.
    Google answers the CORS preflight for this session URI correctly, but the
    actual PUT response never includes Access-Control-Allow-Origin, so the
    browser can't read it — file_name is handed back so the caller can look
    the upload up afterward instead (see find_and_finalize_upload)."""
    drive_account = _get_drive_account(drive_account_id)
    creds = _get_credentials(drive_account)
    file_name = build_drive_filename(schema, entry, user_file_name)

    metadata = {'name': file_name}
    if drive_account.drive_folder_id:
        metadata['parents'] = [drive_account.drive_folder_id]

    resp = requests.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
        headers={
            'Authorization': f'Bearer {creds.token}',
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': 'application/pdf',
        },
        json=metadata,
    )
    resp.raise_for_status()
    return drive_account, creds.token, resp.headers['Location'], file_name


def find_and_finalize_upload(drive_account, file_name):
    """Looks up the file the browser's direct upload should have created (by
    the exact name the backend assigned — drive.file scope means only files
    this app's account created are visible, so there's no risk of matching
    an unrelated file), retrying briefly for any propagation delay, then
    shares it and returns (drive_file_id, web_view_link)."""
    service = _build_service(drive_account)
    files = []
    for _attempt in range(5):
        result = service.files().list(
            q=f"name = '{file_name}' and trashed = false",
            orderBy='createdTime desc', pageSize=1, fields='files(id)',
        ).execute()
        files = result.get('files', [])
        if files:
            break
        time.sleep(1.5)

    if not files:
        raise RuntimeError(f'Upload did not complete — no file named "{file_name}" found on Drive.')

    drive_file_id = files[0]['id']
    service.permissions().create(
        fileId=drive_file_id, body={'type': 'anyone', 'role': 'reader'},
    ).execute()

    refreshed = service.files().get(fileId=drive_file_id, fields='webViewLink').execute()
    return drive_file_id, refreshed.get('webViewLink')
