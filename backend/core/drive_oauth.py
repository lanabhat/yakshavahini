"""
Google Drive OAuth2 flow — used to connect a real Gmail account (rather than
a bare service account, which has no storage quota of its own on a personal
Google Drive). Uploads made under a connected account count against that
account's normal Drive storage.
"""
from google_auth_oauthlib.flow import Flow
from django.conf import settings

# drive.file: the app can only see/manage files it created itself — the
# minimal scope needed for uploading and sharing files.
OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive.file']


def build_flow(code_verifier=None):
    """
    code_verifier: pass None when starting the flow (one gets auto-generated
    and must be saved via the returned Flow's `.code_verifier` — PKCE is on
    by default). Pass the saved value back in when rebuilding the Flow to
    handle the callback, since a fresh Flow object doesn't otherwise know it.
    """
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            # www.googleapis.com/oauth2/v4/token is the older alias for the
            # same token endpoint (oauth2.googleapis.com/token) — used since
            # PythonAnywhere's outbound-network whitelist is per-hostname.
            "token_uri": "https://www.googleapis.com/oauth2/v4/token",
            "redirect_uris": [settings.GOOGLE_DRIVE_OAUTH_REDIRECT_URI],
        }
    }
    return Flow.from_client_config(
        client_config, scopes=OAUTH_SCOPES, redirect_uri=settings.GOOGLE_DRIVE_OAUTH_REDIRECT_URI,
        code_verifier=code_verifier,
    )
