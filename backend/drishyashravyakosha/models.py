from django.db import models

from core.models import CatalogEntryBase, TaxonomyBase


class Presenter(TaxonomyBase):
    pass


class DrishyaShravyaKoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'DSK'

    event_type = models.CharField(max_length=255, blank=True, null=True)  # ಕಾರ್ಯಕ್ರಮ
    subject = models.CharField(max_length=500)  # ವಿಷಯ
    details = models.TextField(blank=True, null=True)  # ವಿವರಗಳು
    date_kannada = models.CharField(max_length=50, blank=True, null=True)  # ದಿನಾಂಕ
    date_english = models.DateField(blank=True, null=True)
    video_link = models.URLField(max_length=500, blank=True, null=True)  # YouTube/Facebook link
    presenters = models.ManyToManyField(Presenter, blank=True, related_name='entries')  # ಉಪನ್ಯಾಸಕರು

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.subject or self.entry_id
