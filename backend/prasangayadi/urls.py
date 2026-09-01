"""
Project-specific extra routes for Prasanga Yadi, on top of the generic
/api/v1/prasangayadi/... routes from core.project_urls. See
yakshavahini_project/urls.py for how this gets included alongside the
generic per-project loop (same pattern as drishyashravyakosha/urls.py).
"""
from django.urls import path

from .views import PrasangaYadiCsvImportView

urlpatterns = [
    path('import-csv/', PrasangaYadiCsvImportView.as_view()),
]
