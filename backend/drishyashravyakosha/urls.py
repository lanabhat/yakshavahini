"""
Project-specific extra routes for Drishya-Kavya Sanchaya, on top of the
generic /api/v1/drishyashravyakosha/... routes from core.project_urls
(which don't know about this import feature — every project's CSV shape
is different, so it isn't schema-driven like the rest of the generic
views). See yakshavahini_project/urls.py for how this gets included
alongside the generic per-project loop.
"""
from django.urls import path

from .views import DrishyaShravyaCsvImportView

urlpatterns = [
    path('import-csv/', DrishyaShravyaCsvImportView.as_view()),
]
