from django.db import models

from core.models import CatalogEntryBase


class MattukoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'MTK'

    name_of_the_mattu = models.CharField(max_length=255)
    link_to_pdf_document = models.URLField(blank=True, null=True)
    date_kannada = models.CharField(max_length=50, blank=True, null=True)
    date_english = models.DateField(blank=True, null=True)
    youtube_video_links = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name_of_the_mattu or self.entry_id
