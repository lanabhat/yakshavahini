from django.db import models

from core.models import CatalogEntryBase, TaxonomyBase


class Situation(TaxonomyBase):
    pass


class Raga(TaxonomyBase):
    pass


class MattukoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'MTK'

    name = models.CharField(max_length=255)  # ಮಟ್ಟಿನ ಹೆಸರು
    unique_number = models.CharField(max_length=50, blank=True, null=True)  # ಅನನ್ಯ ಸಂಖ್ಯೆ (source spreadsheet's own id, distinct from entry_id)
    type = models.CharField(max_length=255, blank=True, null=True)  # ಛಂದಸ್ಸಿನ ವಿಧ
    situations = models.ManyToManyField(Situation, blank=True, related_name='entries')  # ಸಂದರ್ಭ ಸೂಕ್ತತೆ
    ragas = models.ManyToManyField(Raga, blank=True, related_name='entries')  # ಹೊಂದುವ ರಾಗಗಳು
    pdf_link = models.URLField(blank=True, null=True)  # ಮಟ್ಟಿನ ವಿವರದ ದಸ್ತಾವೇಜಿನ ಕೊಂಡಿ
    date_kannada = models.CharField(max_length=50, blank=True, null=True)  # ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ
    date_english = models.DateField(blank=True, null=True)
    youtube_video_links = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name or self.entry_id
