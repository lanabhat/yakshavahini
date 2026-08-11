"""
Generic (schema-driven) entry serialization — one implementation shared by
every project, reading field names from its ProjectSchema instead of having
one hardcoded serializer per project.
"""

from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from django.db import models as django_models
from django.utils.dateparse import parse_date

from .models import DeletionRequest


def _resolve_model(model_path):
    app_label, model_name = model_path.split('.')
    return apps.get_model(app_label, model_name)


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
        'submitted_by': obj.submitted_by.username if obj.submitted_by else '',
        'reviewed_at': obj.reviewed_at.isoformat() if obj.reviewed_at else None,
        'view_count': obj.view_count,
        'has_pending_deletion': has_pending_deletion(obj),
    }
    for tf in schema.taxonomy_fields:
        if tf.multi:
            data[tf.name] = [{'id': r.id, 'name': r.name} for r in getattr(obj, tf.name).all()]
        else:
            related = getattr(obj, tf.name, None)
            data[tf.name] = {'id': related.id, 'name': related.name} if related else None
    for link in schema.link_fields:
        data[link.name] = _serialize_value(obj, link.name)
    for date_field in schema.date_fields:
        data[date_field] = _serialize_value(obj, date_field)
    # Plain scalar fields (e.g. Mattukosha's type/situations/ragas) that
    # aren't the title, a link, a date, or a taxonomy field — just filterable
    # text on the entry itself.
    handled = {schema.title_field, 'notes', *(lf.name for lf in schema.link_fields),
               *schema.date_fields, *(tf.name for tf in schema.taxonomy_fields)}
    for field_name in schema.filterable_fields:
        if field_name not in handled:
            data[field_name] = _serialize_value(obj, field_name)
    return data


def apply_write_fields(schema, obj, payload):
    """Applies whichever of a project's writable fields are present in
    `payload` (a plain dict from request.data) onto `obj`, without saving.
    ManyToMany taxonomy fields are handled separately by `apply_m2m_fields`,
    since they need `obj` to already have a pk."""
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
    handled = {schema.title_field, 'notes', *(lf.name for lf in schema.link_fields),
               *schema.date_fields, *(tf.name for tf in schema.taxonomy_fields)}
    for field_name in schema.filterable_fields:
        if field_name not in handled and field_name in payload:
            setattr(obj, field_name, payload[field_name])
    for tf in schema.taxonomy_fields:
        if tf.multi:
            continue
        name_key = f'{tf.name}_name'
        if name_key in payload:
            name = (payload[name_key] or '').strip()
            if name:
                TaxonomyModel = _resolve_model(tf.model_path)
                taxonomy_obj, _ = TaxonomyModel.objects.get_or_create(name=name)
                setattr(obj, tf.name, taxonomy_obj)
            else:
                setattr(obj, tf.name, None)


def apply_m2m_fields(schema, obj, payload):
    """Applies ManyToMany taxonomy fields (e.g. Pustaka Kosha's authors/
    contributors) — must be called after `obj.save()`, since M2M relations
    require a pk to exist first."""
    for tf in schema.taxonomy_fields:
        if not tf.multi:
            continue
        names_key = f'{tf.name}_names'
        if names_key in payload:
            TaxonomyModel = _resolve_model(tf.model_path)
            names = [n.strip() for n in (payload[names_key] or []) if n.strip()]
            objs = [TaxonomyModel.objects.get_or_create(name=n)[0] for n in names]
            getattr(obj, tf.name).set(objs)
