from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

User = settings.AUTH_USER_MODEL


class TaxonomyBase(models.Model):
    """Base for any project's tag-like lookup entities (e.g. Pratisangraha's
    Kavi/Publisher/Prasanga/Contributor). Most projects won't need any of
    these — Mattukosha doesn't — but any that do just subclass this."""
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        abstract = True
        ordering = ['name']

    def __str__(self):
        return self.name


class CatalogEntryBase(models.Model):
    """Base for every project's main entry model. Holds only the generic
    submission/review workflow — each project's concrete model adds its own
    domain fields (title, links, dates, etc.) on top of this.

    Subclasses must set `ENTRY_ID_PREFIX` (e.g. "MTK") — `save()` uses it to
    auto-generate a per-project sequential `entry_id`.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_correction', 'Needs Correction'),
    ]

    ENTRY_ID_PREFIX = None  # must be overridden by concrete subclasses

    entry_id = models.CharField(max_length=20, unique=True, editable=False)
    notes = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    review_notes = models.TextField(blank=True, null=True)
    submitted_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_submitted',
    )
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.entry_id:
            if not self.ENTRY_ID_PREFIX:
                raise ValueError(f'{type(self).__name__} must define ENTRY_ID_PREFIX')
            last_entry = type(self).objects.order_by('-id').first()
            prefix = self.ENTRY_ID_PREFIX
            if last_entry and last_entry.entry_id.startswith(prefix):
                last_num = int(last_entry.entry_id[len(prefix):])
            else:
                last_num = 0
            self.entry_id = f'{prefix}{last_num + 1:05d}'
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('volunteer', 'Volunteer'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='volunteer')
    google_picture = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.user.email} ({self.role})'


def drive_credential_path(instance, filename):
    return f'drive_credentials/{instance.label}_{filename}'


class DriveAccount(models.Model):
    """A configured Google Drive destination for file uploads, shared across
    all projects (Mattukosha, Pustaka Sangraha, Sanghatana Kosha, ...)."""
    label = models.CharField(max_length=255, unique=True)
    service_account_file = models.FileField(upload_to=drive_credential_path, blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    google_email = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    drive_folder_id = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', 'label']

    def __str__(self):
        return self.label


class DriveFile(models.Model):
    """Tracks which Drive account an uploaded file lives in, for any
    project's entry (via GenericForeignKey, since entries live in different
    concrete models per project rather than one shared table)."""
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    entry = GenericForeignKey('content_type', 'object_id')

    entry_id_text = models.CharField(max_length=20, blank=True, null=True)
    drive_account = models.ForeignKey(
        DriveAccount, null=True, blank=True, on_delete=models.SET_NULL, related_name='files'
    )
    drive_file_id = models.CharField(max_length=255)
    drive_file_url = models.URLField()
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.entry_id_text} -> {self.drive_account}'


class EntryEdit(models.Model):
    """A pending edit proposal on an already-approved entry, awaiting review.
    Project-agnostic: `previous_data`/`proposed_data` are field-name→value
    snapshots, so no schema knowledge is needed here."""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    entry = GenericForeignKey('content_type', 'object_id')

    previous_data = models.JSONField()
    proposed_data = models.JSONField()
    submitted_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='proposed_edits'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_edits'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Edit on entry #{self.object_id} ({self.status})'


class DeletionRequest(models.Model):
    """A pending deletion request on an entry, awaiting admin review."""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    entry = GenericForeignKey('content_type', 'object_id')

    requested_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='requested_deletions'
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_deletions'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Deletion request for entry #{self.object_id} ({self.status})'


class DeletedEntry(models.Model):
    """Archive of removed entries, across all projects — admin-only, nothing
    is ever hard-deleted. `project` records which project app the entry
    belonged to, since `data` is a plain field-name→value snapshot with no
    other way to tell which schema it follows."""
    project = models.CharField(max_length=50)
    data = models.JSONField()
    original_pk = models.IntegerField()
    deleted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    deleted_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)
    was_duplicate = models.BooleanField(default=False)
    duplicate_of_entry_id = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['-deleted_at']

    def __str__(self):
        return f'Deleted {self.project} entry (was pk={self.original_pk})'


class LinkCheckRun(models.Model):
    """One pass of the admin-triggered link-accessibility check, scoped to a
    single project. Processed in small chunks driven by the frontend rather
    than a single long-running request."""
    STATUS_CHOICES = [('running', 'Running'), ('completed', 'Completed')]

    project = models.CharField(max_length=50)
    started_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    total_links = models.PositiveIntegerField(default=0)
    checked_links = models.PositiveIntegerField(default=0)
    broken_links = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'Link check #{self.pk} ({self.project}, {self.status})'


class LinkCheckResult(models.Model):
    """One row per unique URL checked in a run. `link_field` is whichever of
    the project's link fields this came from (e.g. "link_to_pdf_document") —
    not constrained to a fixed choice list, since that varies per project.
    `entries` denormalizes every entry using this exact URL as a list of
    {"id", "entry_id", "title"} dicts, so the checker never needs to re-fetch
    per-entry."""
    run = models.ForeignKey(LinkCheckRun, on_delete=models.CASCADE, related_name='results')
    link_field = models.CharField(max_length=100)
    url = models.URLField(max_length=1000)
    entries = models.JSONField(default=list)
    is_accessible = models.BooleanField(null=True)  # null = not yet checked
    http_status = models.IntegerField(null=True, blank=True)
    error = models.CharField(max_length=255, blank=True)
    checked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.link_field}:{self.url}'
