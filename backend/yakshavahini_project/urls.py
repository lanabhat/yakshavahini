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

# Extra project-specific routes that aren't schema-driven (e.g. a bespoke
# CSV-import endpoint whose column mapping is unique to one project) live
# alongside the generic per-project include above, at the same URL prefix —
# Django tries each top-level path in order, so a sub-path unmatched by
# core.project_urls falls through to here instead of 404ing immediately.
urlpatterns.append(
    path('api/v1/drishyashravyakosha/', include('drishyashravyakosha.urls'))
)
