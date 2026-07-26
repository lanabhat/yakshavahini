from django.urls import path

from .generic_views import (
    EntryDetailView, EntryCreateView, EntryUploadInitView, EntryUploadVerifyView,
    MySubmissionsView, EntryReviewView, PendingEntryListView, EntryListView, StatsView,
    AdminEntrySearchView,
)

# Included once per project slug under `/api/v1/<project>/...` — see the root
# urls.py, which loops over PROJECT_REGISTRY and includes this urlconf once
# per project with `project` bound via the URL kwarg.
urlpatterns = [
    path('entries/', EntryCreateView.as_view(), name='entry-create'),
    path('entries/<int:pk>/', EntryDetailView.as_view(), name='entry-detail'),
    path('entries/<int:pk>/upload/init/', EntryUploadInitView.as_view(), name='entry-upload-init'),
    path('entries/<int:pk>/upload/verify/', EntryUploadVerifyView.as_view(), name='entry-upload-verify'),
    path('entries/<int:pk>/review/', EntryReviewView.as_view(), name='entry-review'),
    path('my-submissions/', MySubmissionsView.as_view(), name='my-submissions'),
    path('pending-entries/', PendingEntryListView.as_view(), name='pending-entries'),
    path('resources/entries', EntryListView.as_view(), name='resources-entries'),
    path('stats/', StatsView.as_view(), name='stats'),
    path('admin/entries/', AdminEntrySearchView.as_view(), name='admin-entries'),
]
