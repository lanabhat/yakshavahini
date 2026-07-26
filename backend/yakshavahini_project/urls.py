"""
URL configuration for yakshavahini_project. Project-specific routes
(/api/v1/<project>/...) are generated once per entry in PROJECT_REGISTRY —
adding a new project is a registry entry away, not a urls.py edit.
"""
from django.contrib import admin
from django.urls import include, path

from core.registry import PROJECT_REGISTRY

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
]

for slug in PROJECT_REGISTRY:
    urlpatterns.append(
        path(f'api/v1/{slug}/', include('core.project_urls'), kwargs={'project': slug})
    )
