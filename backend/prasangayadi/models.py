from django.db import models

from core.models import CatalogEntryBase, TaxonomyBase


class Kavi(TaxonomyBase):
    pass


class PrasangaYadiEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'PRY'

    unique_number = models.CharField(max_length=50, blank=True, null=True)  # ಅನನ್ಯ ಸಂಖ್ಯೆ
    prasanga_name = models.CharField(max_length=500)  # ಪ್ರಸಂಗದ ಹೆಸರು
    kavi = models.ManyToManyField(Kavi, blank=True, related_name='entries')  # ಪ್ರಸಂಗ ಕವಿ
    type = models.CharField(max_length=100, blank=True, null=True)  # ವಿಧ
    publish_status = models.CharField(max_length=100, blank=True, null=True)  # ಪ್ರಕಟಿತವೇ?
    prasanga_type = models.CharField(max_length=100, blank=True, null=True)  # ಪ್ರಸಂಗ ವಿಧ
    prasanga_language = models.CharField(max_length=100, blank=True, null=True)  # ಪ್ರಸಂಗ ಭಾಷೆ
    story_source = models.CharField(max_length=255, blank=True, null=True)  # ಆಧಾರ ಗ್ರಂಥ
    prasanga_kosha_link = models.URLField(max_length=500, blank=True, null=True)  # ಯಕ್ಷಪ್ರಸಂಗಕೋಶದಲ್ಲಿ ಪ್ರತಿಗೆ ಕೊಂಡಿ
    pratisangraha_link = models.URLField(max_length=500, blank=True, null=True)  # ಪ್ರಸಂಗಪ್ರತಿಸಂಗ್ರಹದಲ್ಲಿ ಪ್ರತಿಗೆ ಕೊಂಡಿ

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.prasanga_name or self.entry_id
