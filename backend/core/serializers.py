"""
Generic (schema-driven) entry serialization — one implementation shared by
every project, reading field names from its ProjectSchema instead of having
one hardcoded serializer per project.
"""

from django.contrib.contenttypes.models import ContentType
from django.db import models as django_models
from django.utils.dateparse import parse_date

from .models import DeletionRequest


def _serialize_value(obj, field_name):
    value = getattr(obj, field_name, None)
    field = obj._meta.get_field(field_name)
    if isinstance(field, django_models.DateField) and value is not None:
        # Normally a `date` object once loaded from the DB, but may still be
        # a plain "YYYY-MM-DD" string right after apply_write_fields() sets
        # it on an unsaved instance — handle both.
        return value.isoformat() if hasattr(value, 'isoformat') else value
    return value


def has_pending_deletion(obj):
    ct = ContentType.objects.get_for_model(type(obj))
    return DeletionRequest.objects.filter(content_type=ct, object_id=obj.pk, status='pending').exists()


def serialize_entry(schema, obj):
    data = {
        'id': obj.pk,
        'entry_id': obj.entry_id,
        schema.title_field: getattr(obj, schema.title_field),
        'notes': obj.notes,
        'status': obj.status,
        'review_notes': obj.review_notes,
        'submitted_by': obj.submitted_by.email if obj.submitted_by else '',
        'reviewed_at': obj.reviewed_at.isoformat() if obj.reviewed_at else None,
        'view_count': obj.view_count,
        'has_pending_deletion': has_pending_deletion(obj),
    }
    for taxonomy_field, _ in schema.taxonomy_models:
        related = getattr(obj, taxonomy_field, None)
        data[taxonomy_field] = related.name if related else ''
    for link in schema.link_fields:
        data[link.name] = _serialize_value(obj, link.name)
    for date_field in schema.date_fields:
        data[date_field] = _serialize_value(obj, date_field)
    return data


def apply_write_fields(schema, obj, payload):
    """Applies whichever of a project's writable fields are present in
    `payload` (a plain dict from request.data) onto `obj`, without saving."""
    if schema.title_field in payload:
        setattr(obj, schema.title_field, payload[schema.title_field])
    for link in schema.link_fields:
        if link.name in payload:
            setattr(obj, link.name, payload[link.name])
    for date_field in schema.date_fields:
        if date_field in payload:
            raw = payload[date_field] or None
            field = obj._meta.get_field(date_field)
            if isinstance(field, django_models.DateField) and isinstance(raw, str):
                raw = parse_date(raw)
            setattr(obj, date_field, raw)
    if 'notes' in payload:
        obj.notes = payload['notes']
    for taxonomy_field, model_path in schema.taxonomy_models:
        name_key = f'{taxonomy_field}_name'
        if name_key in payload and payload[name_key]:
            from django.apps import apps
            app_label, model_name = model_path.split('.')
            TaxonomyModel = apps.get_model(app_label, model_name)
            taxonomy_obj, _ = TaxonomyModel.objects.get_or_create(name=payload[name_key].strip())
            setattr(obj, taxonomy_field, taxonomy_obj)
