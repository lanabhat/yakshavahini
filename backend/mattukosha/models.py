from django.db import models

from core.models import CatalogEntryBase


class MattukoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'MTK'

    name = models.CharField(max_length=255)  # ಮಟ್ಟಿನ ಹೆಸರು
    type = models.CharField(max_length=255, blank=True, null=True)  # ಛಂದಸ್ಸಿನ ವಿಧ
    situations = models.TextField(blank=True, null=True)  # ಸಂದರ್ಭ ಸೂಕ್ತತೆ
    ragas = models.CharField(max_length=500, blank=True, null=True)  # ಹೊಂದುವ ರಾಗಗಳು — comma-separated
    pdf_link = models.URLField(blank=True, null=True)  # ಮಟ್ಟಿನ ವಿವರದ ದಸ್ತಾವೇಜಿನ ಕೊಂಡಿ
    date_kannada = models.CharField(max_length=50, blank=True, null=True)  # ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ
    date_english = models.DateField(blank=True, null=True)
    youtube_video_links = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name or self.entry_id
