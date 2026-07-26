"""
Generic, project-agnostic DRF views. Every URL is namespaced with a
`project` slug (see urls.py); each view resolves `PROJECT_REGISTRY[project]`
to know which model/fields to operate on, instead of one view class existing
per project. This is the same "dispatch by a string param" pattern the
Pratisangraha backend already uses for its taxonomy/autocomplete endpoints,
just extended to entry CRUD/search/review as well.
"""

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .permissions import IsVolunteerOrAbove, IsEditor, _role
from .registry import get_project
from .serializers import serialize_entry, apply_write_fields
from .models import DriveFile, DeletionRequest

PAGE_SIZE = 20


def _schema_or_404(project):
    try:
        return get_project(project), None
    except ValueError as e:
        return None, Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)


def _approved_qs(schema):
    return schema.get_model().objects.filter(status='approved')


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
            q = Q(**{f'{schema.title_field}__icontains': fstring}) | Q(notes__icontains=fstring)
            for field in schema.filterable_fields:
                q |= Q(**{f'{field}__icontains': fstring})
            qs = qs.filter(q)
        else:
            for field in schema.filterable_fields:
                if params.get(field):
                    qs = qs.filter(**{f'{field}__icontains': params[field]})
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
            q = Q(**{f'{schema.title_field}__icontains': fstring}) | Q(notes__icontains=fstring)
            for field in schema.filterable_fields:
                q |= Q(**{f'{field}__icontains': fstring})
            qs = qs.filter(q)
        else:
            for field in schema.filterable_fields:
                if params.get(field):
                    qs = qs.filter(**{f'{field}__icontains': params[field]})

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
