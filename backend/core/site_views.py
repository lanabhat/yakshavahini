"""
Global (non-project-scoped) views for the site-wide root landing page and
its Updates section — see models.SiteHomeConfig/SiteUpdate. Kept separate
from generic_views.py the same way auth_views.py/admin_api_views.py/
drive_views.py are, since those are genuinely global concerns rather than
per-project ones dispatched via a `project` URL kwarg.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsEditor
from .registry import PROJECT_REGISTRY
from .models import SiteHomeConfig, SiteUpdate

VALID_SITE_BUTTON_TARGETS = {'external', 'project'}


def _clean_site_blocks(raw):
    """Validate+normalize a requested block list for the site home page,
    dropping anything malformed rather than erroring the whole save —
    mirrors generic_views._clean_blocks, but button targets are
    external/project instead of home/library/external."""
    cleaned = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        block_type = item.get('type')
        if block_type == 'paragraph':
            text = item.get('text')
            if isinstance(text, str) and text.strip():
                cleaned.append({'type': 'paragraph', 'text': text})
        elif block_type == 'button':
            label = item.get('label')
            target_type = item.get('target_type')
            if not (isinstance(label, str) and label.strip() and target_type in VALID_SITE_BUTTON_TARGETS):
                continue
            block = {'type': 'button', 'label': label, 'target_type': target_type}
            if target_type == 'external':
                url = item.get('url')
                if not (isinstance(url, str) and url.strip()):
                    continue
                block['url'] = url
            elif target_type == 'project':
                slug = item.get('project_slug')
                if slug not in PROJECT_REGISTRY:
                    continue
                block['project_slug'] = slug
            cleaned.append(block)
    return cleaned


class SiteHomeConfigView(APIView):
    """
    GET /api/v1/site/home-page/ — public. Returns the admin-authored block
    list for the root landing page (empty list if never configured).

    PUT /api/v1/site/home-page/ { blocks: [...] } — editor/admin only.
    """

    def get_permissions(self):
        return [] if self.request.method == 'GET' else [IsEditor()]

    def get(self, request):
        config = SiteHomeConfig.objects.first()
        return Response({
            'blocks': config.blocks if config else [],
            'maintenance_mode': config.maintenance_mode if config else False,
            'maintenance_message': config.maintenance_message if config else '',
        })

    def put(self, request):
        requested = request.data.get('blocks')
        if not isinstance(requested, list):
            return Response({'error': 'blocks must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        blocks = _clean_site_blocks(requested)
        maintenance_mode = bool(request.data.get('maintenance_mode'))
        maintenance_message = (request.data.get('maintenance_message') or '').strip()

        config = SiteHomeConfig.objects.first()
        if config:
            config.blocks = blocks
            config.maintenance_mode = maintenance_mode
            config.maintenance_message = maintenance_message
            config.save()
        else:
            config = SiteHomeConfig.objects.create(
                blocks=blocks, maintenance_mode=maintenance_mode, maintenance_message=maintenance_message,
            )
        return Response({
            'blocks': config.blocks,
            'maintenance_mode': config.maintenance_mode,
            'maintenance_message': config.maintenance_message,
        })


def _serialize_update(u):
    return {'id': u.pk, 'title': u.title, 'text': u.text, 'created_at': u.created_at.isoformat()}


class SiteUpdateListCreateView(APIView):
    """
    GET  /api/v1/site/updates/ — public, newest first. The admin manager
    and the public "latest 5" section both read this same list.
    POST /api/v1/site/updates/ { title, text } — editor/admin only.
    """

    def get_permissions(self):
        return [] if self.request.method == 'GET' else [IsEditor()]

    def get(self, request):
        return Response([_serialize_update(u) for u in SiteUpdate.objects.all()])

    def post(self, request):
        title = (request.data.get('title') or '').strip()
        text = (request.data.get('text') or '').strip()
        if not title or not text:
            return Response({'error': 'title and text are required'}, status=status.HTTP_400_BAD_REQUEST)
        u = SiteUpdate.objects.create(title=title, text=text)
        return Response(_serialize_update(u), status=status.HTTP_201_CREATED)


class SiteUpdateDetailView(APIView):
    """
    PATCH  /api/v1/site/updates/<pk>/ { title?, text? } — editor/admin only.
    DELETE /api/v1/site/updates/<pk>/ — editor/admin only.
    """
    permission_classes = [IsEditor]

    def patch(self, request, pk):
        try:
            u = SiteUpdate.objects.get(pk=pk)
        except SiteUpdate.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'title' in request.data:
            title = (request.data.get('title') or '').strip()
            if not title:
                return Response({'error': 'title cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            u.title = title
        if 'text' in request.data:
            text = (request.data.get('text') or '').strip()
            if not text:
                return Response({'error': 'text cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            u.text = text
        u.save()
        return Response(_serialize_update(u))

    def delete(self, request, pk):
        try:
            u = SiteUpdate.objects.get(pk=pk)
        except SiteUpdate.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        u.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
