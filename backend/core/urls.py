from django.urls import path

from .auth_views import GoogleLoginView, MeView, AdminLoginView
from .admin_api_views import UserListView, UserDetailView
from .drive_views import (
    DriveAccountListView, DriveAccountDetailView,
    DriveOAuthStartView, DriveOAuthCallbackView,
)
from .generic_views import DeletionRequestListView, DeletionRequestReviewView
from .site_views import SiteHomeConfigView, SiteUpdateListCreateView, SiteUpdateDetailView

# Shared, non-project-namespaced endpoints — auth, user management, and Drive
# account infrastructure are the same regardless of which project you're
# working in.
urlpatterns = [
    path('api/auth/google/', GoogleLoginView.as_view(), name='auth-google'),
    path('api/auth/admin-login/', AdminLoginView.as_view(), name='auth-admin-login'),
    path('api/auth/me/', MeView.as_view(), name='auth-me'),

    path('api/v1/admin/users/', UserListView.as_view(), name='admin-users'),
    path('api/v1/admin/users/<int:pk>/', UserDetailView.as_view(), name='admin-user-detail'),

    path('api/v1/drive-accounts/', DriveAccountListView.as_view(), name='drive-account-list'),
    path('api/v1/drive-accounts/<int:pk>/', DriveAccountDetailView.as_view(), name='drive-account-detail'),
    path('api/v1/drive-accounts/oauth/start/', DriveOAuthStartView.as_view(), name='drive-oauth-start'),
    path('api/v1/drive-accounts/oauth/callback/', DriveOAuthCallbackView.as_view(), name='drive-oauth-callback'),

    path('api/v1/deletion-requests/', DeletionRequestListView.as_view(), name='deletion-request-list'),
    path('api/v1/deletion-requests/<int:pk>/review/', DeletionRequestReviewView.as_view(), name='deletion-request-review'),

    path('api/v1/site/home-page/', SiteHomeConfigView.as_view(), name='site-home-page'),
    path('api/v1/site/updates/', SiteUpdateListCreateView.as_view(), name='site-update-list'),
    path('api/v1/site/updates/<int:pk>/', SiteUpdateDetailView.as_view(), name='site-update-detail'),
]
