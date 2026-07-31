"""
Generic, project-agnostic DRF views. Every URL is namespaced with a
`project` slug (see urls.py); each view resolves `PROJECT_REGISTRY[project]`
to know which model/fields to operate on, instead of one view class existing
per project. This is the same "dispatch by a string param" pattern the
Pratisangraha backend already uses for its taxonomy/autocomplete endpoints,
just extended to entry CRUD/search/review as well.
"""

from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .permissions import IsAdmin, IsVolunteerOrAbove, IsEditor, _role
from .registry import get_project, PROJECT_REGISTRY
from .serializers import apply_m2m_fields, serialize_entry, apply_write_fields
from .models import DriveFile, DeletionRequest, FilterConfig, ListDisplayConfig, LandingPageConfig

PAGE_SIZE = 20


def _schema_or_404(project):
    try:
        return get_project(project), None
    except ValueError as e:
        return None, Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)


def _approved_qs(schema):
    return schema.get_model().objects.filter(status='approved')


def _apply_fstring(schema, qs, fstring):
    q = Q(**{f'{schema.title_field}__icontains': fstring}) | Q(notes__icontains=fstring)
    for field in schema.filterable_fields:
        q |= Q(**{f'{field}__icontains': fstring})
    for tf in schema.taxonomy_fields:
        q |= Q(**{f'{tf.name}__name__icontains': fstring})
    return qs.filter(q).distinct()


def _apply_field_filters(schema, qs, params):
    distinct = False
    for field in schema.filterable_fields:
        if params.get(field):
            qs = qs.filter(**{f'{field}__icontains': params[field]})
    for tf in schema.taxonomy_fields:
        id_param = f'{tf.name}_id'
        if params.get(id_param):
            qs = qs.filter(**{f'{tf.name}__id': params[id_param]})
            if tf.multi:
                distinct = True
    return qs.distinct() if distinct else qs


class EntryDetailView(APIView):
    """GET / PATCH / DELETE /api/v1/<project>/entries/<pk>/"""

    def get(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        Model = schema.get_model()
        try:
            entry = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if entry.status != 'approved' and not request.user.is_authenticated:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        Model.objects.filter(pk=pk).update(view_count=entry.view_count + 1)
        return Response(serialize_entry(schema, entry))

    def patch(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        Model = schema.get_model()
        try:
            entry = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        role = _role(request)
        is_own = entry.submitted_by_id == request.user.id
        if role not in ('editor', 'admin') and not is_own:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        apply_write_fields(schema, entry, request.data)

        requested_status = request.data.get('status')
        action = request.data.get('action')  # 'draft' | 'submit' | None

        if role == 'admin':
            if requested_status:
                entry.status = requested_status
            elif action == 'draft':
                entry.status = 'draft'
            else:
                entry.status = 'approved'
            if 'review_notes' in request.data:
                entry.review_notes = request.data['review_notes'] or ''
        elif requested_status == 'draft' and entry.status == 'pending' and is_own:
            entry.status = 'draft'
        else:
            has_link = any(bool(getattr(entry, lf.name, None)) for lf in schema.link_fields if not lf.is_array)
            if entry.status == 'draft':
                if action == 'submit' or has_link:
                    entry.status = 'pending'
            elif entry.status in ('pending', 'needs_correction', 'rejected'):
                entry.status = 'pending'
            entry.review_notes = ''

        entry.save()
        apply_m2m_fields(schema, entry, request.data)
        return Response(serialize_entry(schema, entry))

    def delete(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        Model = schema.get_model()

        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        role = _role(request)
        if role is None:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            entry = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if entry.status == 'draft':
            is_own = entry.submitted_by_id == request.user.id
            if role not in ('editor', 'admin') and not is_own:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            entry.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        reason = request.data.get('reason', '')

        # A confirmed duplicate (shares a non-array link field's value with
        # another live entry) can be removed immediately regardless of role.
        duplicate_of = None
        for lf in schema.link_fields:
            if lf.is_array:
                continue
            value = getattr(entry, lf.name, None)
            if value:
                duplicate_of = Model.objects.filter(**{lf.name: value}).exclude(pk=entry.pk).first()
            if duplicate_of:
                break

        ct = ContentType.objects.get_for_model(Model)
        if duplicate_of is not None or role == 'admin':
            _archive_entry(schema, entry, request.user, reason, duplicate_of)
            return Response(status=status.HTTP_204_NO_CONTENT)

        if DeletionRequest.objects.filter(content_type=ct, object_id=entry.pk, status='pending').exists():
            return Response(
                {'message': 'A deletion request for this entry is already pending review.'},
                status=status.HTTP_202_ACCEPTED,
            )

        DeletionRequest.objects.create(content_type=ct, object_id=entry.pk, requested_by=request.user, reason=reason)
        return Response({'message': 'Deletion submitted for review.'}, status=status.HTTP_202_ACCEPTED)


def _archive_entry(schema, entry, deleted_by, reason, duplicate_of):
    from .models import DeletedEntry
    DeletedEntry.objects.create(
        project=schema.slug,
        data=serialize_entry(schema, entry),
        original_pk=entry.pk,
        deleted_by=deleted_by,
        reason=reason,
        was_duplicate=duplicate_of is not None,
        duplicate_of_entry_id=duplicate_of.entry_id if duplicate_of else None,
    )
    entry.delete()


class EntryCreateView(APIView):
    """POST /api/v1/<project>/entries/"""
    permission_classes = [IsVolunteerOrAbove]

    def post(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        Model = schema.get_model()
        role = _role(request)

        entry = Model()
        entry.submitted_by = request.user

        action = request.data.get('action', 'submit')
        has_link = any(
            bool(request.data.get(lf.name)) for lf in schema.link_fields if not lf.is_array
        )

        if role == 'admin':
            entry.status = 'approved'
        elif action == 'draft' and not has_link:
            entry.status = 'draft'
        else:
            entry.status = 'pending'

        apply_write_fields(schema, entry, request.data)
        entry.save()
        apply_m2m_fields(schema, entry, request.data)
        return Response(serialize_entry(schema, entry), status=status.HTTP_201_CREATED)


def _get_entry_for_upload(schema, request, pk):
    Model = schema.get_model()
    try:
        entry = Model.objects.get(pk=pk)
    except Model.DoesNotExist:
        return None, None, Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    role = _role(request)
    if role not in ('admin', 'editor') and entry.submitted_by_id != request.user.id:
        return None, None, Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    return entry, role, None


class EntryUploadInitView(APIView):
    """POST /api/v1/<project>/entries/<pk>/upload/init/
    { file_name?, drive_account_id? } — opens a Drive resumable-upload
    session; the browser PUTs the file bytes straight to Drive."""
    permission_classes = [IsVolunteerOrAbove]

    def post(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        entry, role, error = _get_entry_for_upload(schema, request, pk)
        if error:
            return error

        drive_account_id = request.data.get('drive_account_id') or None
        user_file_name = request.data.get('file_name') or None

        try:
            from .drive_utils import start_resumable_upload_session
            drive_account, access_token, upload_url, file_name = start_resumable_upload_session(
                schema, entry, user_file_name, drive_account_id,
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'upload_url': upload_url,
            'access_token': access_token,
            'drive_account_id': drive_account.pk,
            'file_name': file_name,
        })


class EntryUploadVerifyView(APIView):
    """POST /api/v1/<project>/entries/<pk>/upload/verify/
    { file_name, drive_account_id, link_field } — called once the browser's
    direct PUT to Drive finishes; looks the file up by the name the backend
    itself assigned (the browser can't read the PUT response — see
    drive_utils docstring), shares it, and records it against the entry's
    `link_field`."""
    permission_classes = [IsVolunteerOrAbove]

    def post(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        entry, role, error = _get_entry_for_upload(schema, request, pk)
        if error:
            return error

        file_name = request.data.get('file_name')
        drive_account_id = request.data.get('drive_account_id')
        link_field = request.data.get('link_field') or (schema.link_fields[0].name if schema.link_fields else None)
        if not file_name or not drive_account_id or not link_field:
            return Response(
                {'error': 'file_name, drive_account_id and link_field are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from .models import DriveAccount
            drive_account = DriveAccount.objects.get(pk=drive_account_id)
            from .drive_utils import find_and_finalize_upload
            drive_file_id, url = find_and_finalize_upload(drive_account, file_name)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        ct = ContentType.objects.get_for_model(schema.get_model())
        DriveFile.objects.create(
            content_type=ct, object_id=entry.pk, entry_id_text=entry.entry_id,
            drive_account=drive_account, drive_file_id=drive_file_id, drive_file_url=url,
            uploaded_by=request.user,
        )

        setattr(entry, link_field, url)
        if entry.status == 'draft' and role != 'admin':
            entry.status = 'pending'
        entry.save()
        return Response({'url': url, 'entry_id': entry.entry_id})


class MySubmissionsView(APIView):
    """GET /api/v1/<project>/my-submissions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        qs = schema.get_model().objects.filter(submitted_by=request.user).order_by('-id')
        return Response([serialize_entry(schema, e) for e in qs])


class EntryReviewView(APIView):
    """PATCH /api/v1/<project>/entries/<pk>/review/"""
    permission_classes = [IsEditor]

    def patch(self, request, project, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        Model = schema.get_model()
        try:
            entry = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if entry.submitted_by_id == request.user.id and _role(request) != 'admin':
            return Response({'error': 'You cannot review your own submission'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        allowed = ('approved', 'rejected', 'needs_correction', 'pending')
        if new_status not in allowed:
            return Response({'error': f'status must be one of {allowed}'}, status=status.HTTP_400_BAD_REQUEST)

        entry.status = new_status
        entry.review_notes = request.data.get('review_notes', entry.review_notes)
        entry.reviewed_by = request.user
        entry.reviewed_at = timezone.now()
        entry.save()
        return Response(serialize_entry(schema, entry))


class PendingEntryListView(APIView):
    """GET /api/v1/<project>/pending-entries/ — editor/admin."""
    permission_classes = [IsEditor]

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        qs = schema.get_model().objects.filter(status='pending').order_by('id')
        return Response([serialize_entry(schema, e) for e in qs])


# ── public read-only browsing (search/sort/filter/paginate) ────────────────

class EntryListView(APIView):
    """
    GET /api/v1/<project>/resources/entries
      ?fstring=X                    — free-text OR search across title/notes/filterable fields
      ?<filterable_field>=X         — icontains filter on a specific field
      ?has_link=true                — only entries where the first non-array link field is set
      ?sort=<key>&order=asc|desc    — key must be one of schema.sortable_fields
      ?pageno=N                     — optional; omit to get everything at once
    """

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        params = request.query_params
        qs = _approved_qs(schema)

        fstring = params.get('fstring', '').strip()
        if fstring:
            qs = _apply_fstring(schema, qs, fstring)
        else:
            qs = _apply_field_filters(schema, qs, params)
            if params.get('has_link') == 'true':
                pdf_fields = [lf for lf in schema.link_fields if not lf.is_array]
                if pdf_fields:
                    field_name = pdf_fields[0].name
                    qs = qs.exclude(**{f'{field_name}__isnull': True}).exclude(**{field_name: ''})

        sort_key = params.get('sort')
        order_field = schema.sortable_fields.get(sort_key, 'id')
        if params.get('order') == 'desc':
            order_field = f'-{order_field}'
        qs = qs.order_by(order_field)

        total = qs.count()
        pageno_raw = params.get('pageno')
        if pageno_raw is not None:
            try:
                pageno = max(int(pageno_raw), 0)
            except (TypeError, ValueError):
                pageno = 0
            all_loaded = (pageno + PAGE_SIZE) >= total
            page_qs = qs[pageno:pageno + PAGE_SIZE]
            return Response({
                'total': total,
                'dataset': [serialize_entry(schema, e) for e in page_qs],
                'allLoaded': all_loaded,
            })

        return Response({
            'total': total,
            'dataset': [serialize_entry(schema, e) for e in qs],
            'allLoaded': True,
        })


class StatsView(APIView):
    """GET /api/v1/<project>/stats/ — lightweight stats for the public home
    page: total count and the most recently added entries."""

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        qs = _approved_qs(schema)
        total = qs.count()
        recently_added = qs.order_by('-created_at')[:8]
        most_viewed = qs.order_by('-view_count')[:8]
        return Response({
            'total': total,
            'recently_added': [serialize_entry(schema, e) for e in recently_added],
            'most_viewed': [serialize_entry(schema, e) for e in most_viewed],
        })


class AdminEntrySearchView(APIView):
    """GET /api/v1/<project>/admin/entries/ — editor/admin only. Same filter
    vocabulary as the public EntryListView (fstring, filterable fields, sort,
    order, pageno), but searches entries of every status (not just approved)
    via an optional `status` param."""
    permission_classes = [IsEditor]

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        params = request.query_params
        qs = schema.get_model().objects.all()

        if params.get('status'):
            qs = qs.filter(status=params['status'])

        fstring = params.get('fstring', '').strip()
        if fstring:
            qs = _apply_fstring(schema, qs, fstring)
        else:
            qs = _apply_field_filters(schema, qs, params)

        sort_key = params.get('sort')
        order_field = schema.sortable_fields.get(sort_key, '-id')
        if params.get('order') == 'desc':
            order_field = f'-{order_field}'
        qs = qs.order_by(order_field)

        total = qs.count()
        pageno_raw = params.get('pageno')
        if pageno_raw is not None:
            try:
                pageno = max(int(pageno_raw), 0)
            except (TypeError, ValueError):
                pageno = 0
            all_loaded = (pageno + PAGE_SIZE) >= total
            page_qs = qs[pageno:pageno + PAGE_SIZE]
            return Response({
                'total': total,
                'dataset': [serialize_entry(schema, e) for e in page_qs],
                'allLoaded': all_loaded,
            })

        return Response({
            'total': total,
            'dataset': [serialize_entry(schema, e) for e in qs],
            'allLoaded': True,
        })


class EntryGroupsView(APIView):
    """GET /api/v1/<project>/resources/groups?field=<groupable field name>
    Distinct-value + count facet browsing over any of the project's
    schema.groupable_fields — e.g. Mattukosha's "type" (ಛಂದಸ್ಸಿನ ವಿಧ) or
    "ragas" (comma-separated, so each raga is counted individually rather
    than the whole string being one group)."""

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        field_name = request.query_params.get('field')
        gf = next((g for g in schema.groupable_fields if g.name == field_name), None)
        if gf is None:
            valid = [g.name for g in schema.groupable_fields]
            return Response({'error': f'field must be one of {valid}'}, status=status.HTTP_400_BAD_REQUEST)

        qs = _approved_qs(schema).exclude(**{f'{gf.name}__isnull': True}).exclude(**{gf.name: ''})
        counts = {}
        for raw_value in qs.values_list(gf.name, flat=True):
            if gf.multivalue:
                parts = [p.strip() for p in raw_value.split(gf.delimiter) if p.strip()]
            else:
                parts = [raw_value.strip()] if raw_value.strip() else []
            for part in parts:
                counts[part] = counts.get(part, 0) + 1

        groups = sorted(({'name': name, 'count': count} for name, count in counts.items()), key=lambda g: g['name'])
        return Response(groups)


# ── taxonomy management (Author/Publisher/Category/Contributor, etc.) ──────

def _taxonomy_field_or_404(schema, field_name):
    tf = next((t for t in schema.taxonomy_fields if t.name == field_name), None)
    if tf is None:
        valid = [t.name for t in schema.taxonomy_fields]
        return None, Response({'error': f'field must be one of {valid}'}, status=status.HTTP_400_BAD_REQUEST)
    return tf, None


def _resolve_taxonomy_model(tf):
    from django.apps import apps
    app_label, model_name = tf.model_path.split('.')
    return apps.get_model(app_label, model_name)


class AutocompleteView(APIView):
    """GET /api/v1/<project>/autocomplete/?field=<taxonomy field>&q=text"""

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, request.query_params.get('field', ''))
        if err:
            return err

        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])

        Model = _resolve_taxonomy_model(tf)
        qs = Model.objects.filter(name__icontains=q).order_by('name')[:10]
        return Response([{'id': obj.pk, 'name': obj.name} for obj in qs])


class TaxonomyListCreateView(APIView):
    """
    GET  /api/v1/<project>/taxonomy/<field>/?q=text — editor/admin, list all
    (optionally filtered by name), each with how many entries reference it.
    POST /api/v1/<project>/taxonomy/<field>/ { name } — create a new one.
    """
    permission_classes = [IsEditor]

    def get(self, request, project, field):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, field)
        if err:
            return err

        Model = _resolve_taxonomy_model(tf)
        qs = Model.objects.annotate(entry_count=Count('entries', distinct=True))
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(name__icontains=q)
        qs = qs.order_by('name')

        return Response([{'id': obj.pk, 'name': obj.name, 'entry_count': obj.entry_count} for obj in qs])

    def post(self, request, project, field):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, field)
        if err:
            return err

        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

        Model = _resolve_taxonomy_model(tf)
        if Model.objects.filter(name=name).exists():
            return Response({'error': f'"{name}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

        obj = Model.objects.create(name=name)
        return Response({'id': obj.pk, 'name': obj.name, 'entry_count': 0}, status=status.HTTP_201_CREATED)


class TaxonomyDetailView(APIView):
    """
    PATCH  /api/v1/<project>/taxonomy/<field>/<pk>/ { name } — rename.
    DELETE /api/v1/<project>/taxonomy/<field>/<pk>/ — only allowed when no
    entry references it (merge duplicates first).
    """
    permission_classes = [IsEditor]

    def patch(self, request, project, field, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, field)
        if err:
            return err
        Model = _resolve_taxonomy_model(tf)

        try:
            obj = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

        if Model.objects.exclude(pk=pk).filter(name=name).exists():
            return Response({'error': f'"{name}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

        obj.name = name
        obj.save(update_fields=['name'])
        entry_count = Model.objects.filter(pk=pk).annotate(
            entry_count=Count('entries', distinct=True)
        ).values_list('entry_count', flat=True).first()
        return Response({'id': obj.pk, 'name': obj.name, 'entry_count': entry_count or 0})

    def delete(self, request, project, field, pk):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, field)
        if err:
            return err
        Model = _resolve_taxonomy_model(tf)

        try:
            obj = Model.objects.get(pk=pk)
        except Model.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        entry_count = Model.objects.filter(pk=pk).annotate(
            entry_count=Count('entries', distinct=True)
        ).values_list('entry_count', flat=True).first() or 0
        if entry_count > 0:
            return Response(
                {'error': f'Still used by {entry_count} entr{"y" if entry_count == 1 else "ies"} — reassign or merge them first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaxonomyMergeView(APIView):
    """
    POST /api/v1/<project>/taxonomy/<field>/merge/ { keep_id, merge_ids: [...] }
    — admin only. Repoints every entry referencing any of merge_ids over to
    keep_id (bulk `update` for a single FK, add/remove for M2M), then deletes
    the merged rows. Safe by construction: entries only ever reference these
    taxonomy rows by FK/M2M — nothing else points at them.
    """
    permission_classes = [IsAdmin]

    def post(self, request, project, field):
        schema, err = _schema_or_404(project)
        if err:
            return err
        tf, err = _taxonomy_field_or_404(schema, field)
        if err:
            return err
        Model = _resolve_taxonomy_model(tf)

        keep_id = request.data.get('keep_id')
        merge_ids = request.data.get('merge_ids') or []
        if not keep_id or not isinstance(merge_ids, list) or not merge_ids:
            return Response({'error': 'keep_id and a non-empty merge_ids list are required'}, status=status.HTTP_400_BAD_REQUEST)

        merge_ids = [mid for mid in merge_ids if mid != keep_id]
        if not merge_ids:
            return Response({'error': 'merge_ids must not be empty (and cannot include keep_id)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            keep_obj = Model.objects.get(pk=keep_id)
        except Model.DoesNotExist:
            return Response({'error': 'keep_id not found'}, status=status.HTTP_404_NOT_FOUND)

        merge_objs = list(Model.objects.filter(pk__in=merge_ids))
        if len(merge_objs) != len(merge_ids):
            return Response({'error': 'One or more merge_ids not found'}, status=status.HTTP_404_NOT_FOUND)

        EntryModel = schema.get_model()
        if tf.multi:
            for entry in EntryModel.objects.filter(**{f'{tf.name}__in': merge_ids}).distinct():
                getattr(entry, tf.name).remove(*merge_objs)
                getattr(entry, tf.name).add(keep_obj)
        else:
            EntryModel.objects.filter(**{f'{tf.name}_id__in': merge_ids}).update(**{f'{tf.name}_id': keep_id})

        merged_count = len(merge_objs)
        Model.objects.filter(pk__in=merge_ids).delete()

        entry_count = Model.objects.filter(pk=keep_id).annotate(
            entry_count=Count('entries', distinct=True)
        ).values_list('entry_count', flat=True).first()

        return Response({
            'id': keep_obj.pk, 'name': keep_obj.name, 'entry_count': entry_count or 0,
            'merged_count': merged_count,
        })


# ── admin-configurable public filter sidebar ────────────────────────────────

class FilterConfigView(APIView):
    """
    GET /api/v1/<project>/filter-config/ — public (the public site reads this
    on every Library page load to decide which facets to show). Returns every
    field available for facet browsing (schema.groupable_fields +
    schema.taxonomy_fields) plus which of them are currently enabled. Absence
    of a stored FilterConfig row means "everything available is enabled" —
    a project that's never been configured behaves exactly as before this
    feature existed.

    PUT /api/v1/<project>/filter-config/ { enabled: [field, ...] } — editor/
    admin only. Silently drops any name not in `available`.
    """

    def get_permissions(self):
        return [IsEditor()] if self.request.method == 'PUT' else []

    def _available(self, schema):
        available = [{'field': gf.name, 'label': gf.label, 'kind': 'scalar'} for gf in schema.groupable_fields]
        available += [{'field': tf.name, 'label': tf.label, 'kind': 'taxonomy'} for tf in schema.taxonomy_fields]
        return available

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        available = self._available(schema)
        config = FilterConfig.objects.filter(project=project).first()
        enabled = config.enabled_fields if config else [a['field'] for a in available]

        return Response({'available': available, 'enabled': enabled})

    def put(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        valid_fields = {a['field'] for a in self._available(schema)}
        requested = request.data.get('enabled')
        if not isinstance(requested, list):
            return Response({'error': 'enabled must be a list of field names'}, status=status.HTTP_400_BAD_REQUEST)

        enabled = [f for f in requested if f in valid_fields]
        config, _ = FilterConfig.objects.update_or_create(
            project=project, defaults={'enabled_fields': enabled},
        )
        return Response({'available': self._available(schema), 'enabled': config.enabled_fields})


# ── admin-configurable public list-view display fields ─────────────────────

VALID_FONT_SIZES = {'sm', 'md', 'lg'}


DATE_FIELD_KEY = '__date__'


class ListDisplayConfigView(APIView):
    """
    GET /api/v1/<project>/list-display-config/ — public (the public site
    reads this to decide which extra fields to show under the title on the
    library list/grid, in what order, and at what size). Returns every field
    available (schema.display_fields, plus a synthetic "__date__" entry if
    the project has schema.date_display_label set) and the currently-selected
    subset **in order** with each one's font size — `selected` is a plain
    JSON list, so whatever order the admin UI submits is exactly the order
    rendered.

    Absence of a stored ListDisplayConfig row means "show whatever showed
    before this feature existed": just the date, if the project has one,
    otherwise nothing extra.

    PUT /api/v1/<project>/list-display-config/ { selected: [{field, font_size}, ...] }
    — editor/admin only. Drops any field not in `available` and any
    font_size not in {'sm', 'md', 'lg'}; preserves the submitted order.
    """

    def get_permissions(self):
        return [IsEditor()] if self.request.method == 'PUT' else []

    def _available(self, schema):
        available = [{'field': df.name, 'label': df.label, 'kind': df.kind} for df in schema.display_fields]
        if schema.date_fields and schema.date_display_label:
            available.append({'field': DATE_FIELD_KEY, 'label': schema.date_display_label, 'kind': 'date'})
        return available

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        available = self._available(schema)
        config = ListDisplayConfig.objects.filter(project=project).first()
        if config:
            selected = config.fields
        elif schema.date_fields and schema.date_display_label:
            selected = [{'field': DATE_FIELD_KEY, 'font_size': 'sm'}]
        else:
            selected = []

        return Response({'available': available, 'selected': selected})

    def put(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        valid_fields = {a['field'] for a in self._available(schema)}
        requested = request.data.get('selected')
        if not isinstance(requested, list):
            return Response({'error': 'selected must be a list of {field, font_size}'}, status=status.HTTP_400_BAD_REQUEST)

        selected = [
            {'field': item.get('field'), 'font_size': item.get('font_size')}
            for item in requested
            if isinstance(item, dict) and item.get('field') in valid_fields and item.get('font_size') in VALID_FONT_SIZES
        ]
        config, _ = ListDisplayConfig.objects.update_or_create(
            project=project, defaults={'fields': selected},
        )
        return Response({'available': self._available(schema), 'selected': config.fields})


# ── admin-configurable public landing page (paragraphs + buttons) ──────────

VALID_BLOCK_TYPES = {'paragraph', 'button'}
VALID_BUTTON_TARGETS = {'home', 'library', 'external'}


def _clean_blocks(raw):
    """Validate+normalize a requested block list, dropping anything malformed
    rather than erroring the whole save — same permissiveness as
    ListDisplayConfigView.put's field filtering."""
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
            if not (isinstance(label, str) and label.strip() and target_type in VALID_BUTTON_TARGETS):
                continue
            block = {'type': 'button', 'label': label, 'target_type': target_type}
            if target_type == 'external':
                url = item.get('url')
                if not (isinstance(url, str) and url.strip()):
                    continue
                block['url'] = url
            cleaned.append(block)
    return cleaned


class LandingPageConfigView(APIView):
    """
    GET /api/v1/<project>/landing-page/ — public. Returns the admin-authored
    block list for this project's landing page (empty list if never
    configured — the public site then falls back to its generic Home page).

    PUT /api/v1/<project>/landing-page/ { blocks: [...] } — editor/admin
    only. Malformed blocks are silently dropped rather than rejecting the
    whole request, same permissiveness as the other config views above.
    """

    def get_permissions(self):
        return [IsEditor()] if self.request.method == 'PUT' else []

    def get(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err
        config = LandingPageConfig.objects.filter(project=project).first()
        return Response({'blocks': config.blocks if config else []})

    def put(self, request, project):
        schema, err = _schema_or_404(project)
        if err:
            return err

        requested = request.data.get('blocks')
        if not isinstance(requested, list):
            return Response({'error': 'blocks must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        blocks = _clean_blocks(requested)
        config, _ = LandingPageConfig.objects.update_or_create(
            project=project, defaults={'blocks': blocks},
        )
        return Response({'blocks': config.blocks})


# ── deletion request review (editor/admin approval queue) ──────────────────
# EntryDetailView.delete() above is the create side: a volunteer's delete on
# a live (non-draft) entry creates one of these instead of deleting directly.
# DeletionRequest uses a generic FK, so — unlike every other view in this
# file — this is one shared review inbox across every project rather than a
# per-project endpoint (see core/urls.py, not core/project_urls.py).

def _schema_for_content_type(ct):
    model_cls = ct.model_class()
    for schema in PROJECT_REGISTRY.values():
        if schema.get_model() is model_cls:
            return schema
    return None


def _serialize_deletion_request(dr):
    schema = _schema_for_content_type(dr.content_type)
    entry = dr.entry
    title = getattr(entry, schema.title_field, '') or '' if (entry is not None and schema is not None) else ''
    return {
        'id': dr.pk,
        'project': schema.slug if schema else None,
        'project_label': schema.label if schema else '',
        'entry_pk': dr.object_id,
        'entry_display_id': entry.entry_id if entry is not None else '',
        'title': title,
        'requested_by': dr.requested_by.email if dr.requested_by else '',
        'reason': dr.reason or '',
        'status': dr.status,
        'reviewed_by': dr.reviewed_by.email if dr.reviewed_by else '',
        'reviewed_at': dr.reviewed_at.isoformat() if dr.reviewed_at else None,
        'created_at': dr.created_at.isoformat(),
    }


class DeletionRequestListView(APIView):
    """GET /api/v1/deletion-requests/?status=pending|approved|rejected|all
    (default pending) — editor/admin."""
    permission_classes = [IsEditor]

    def get(self, request):
        status_param = request.query_params.get('status', 'pending')
        qs = DeletionRequest.objects.select_related('content_type', 'requested_by', 'reviewed_by').order_by('-created_at')
        if status_param != 'all':
            qs = qs.filter(status=status_param)
        return Response([_serialize_deletion_request(dr) for dr in qs])


class DeletionRequestReviewView(APIView):
    """PATCH /api/v1/deletion-requests/<pk>/review/ { status: approved|rejected }
    — admin only. Approving archives the live entry (same `_archive_entry`
    helper `EntryDetailView.delete()` uses) then hard-deletes it; rejecting
    just marks the request reviewed and leaves the entry untouched."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            dr = DeletionRequest.objects.get(pk=pk)
        except DeletionRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if dr.status != 'pending':
            return Response({'error': 'This request has already been reviewed.'}, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected'):
            return Response({'error': 'status must be "approved" or "rejected"'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == 'approved':
            schema = _schema_for_content_type(dr.content_type)
            entry = dr.entry
            if entry is None or schema is None:
                return Response({'error': 'The entry no longer exists.'}, status=status.HTTP_400_BAD_REQUEST)
            _archive_entry(schema, entry, request.user, dr.reason or '', duplicate_of=None)
            # entry.delete() (inside _archive_entry) set the deleted instance's
            # pk to None; dr's GenericForeignKey still has that now-"unsaved"
            # object cached, which makes Django's save() safety check refuse
            # to save dr below ("unsaved related object"). refresh_from_db()
            # clears that stale cache without losing our pending field edits
            # below (they're set after this, not before).
            dr.refresh_from_db()

        dr.status = new_status
        dr.reviewed_by = request.user
        dr.reviewed_at = timezone.now()
        dr.save()
        return Response(_serialize_deletion_request(dr))
