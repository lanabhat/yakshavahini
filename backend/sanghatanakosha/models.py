from django.db import models

from core.models import CatalogEntryBase


class SanghatanaKoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'YSK'

    name_of_the_org = models.CharField(max_length=500)  # ಸಂಘಟನೆಯ ಹೆಸರು
    details = models.TextField(blank=True, null=True)  # ಸಂಘಟನೆಯ ವಿವರ
    type_of_org = models.CharField(max_length=255, blank=True, null=True)  # ಸಂಘಟನೆಯ ವಿಧ
    yakshagana_category = models.CharField(max_length=255, blank=True, null=True)  # ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ
    yakshagana_sub_category = models.CharField(max_length=255, blank=True, null=True)  # ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ
    estabishment_date = models.CharField(max_length=50, blank=True, null=True)  # ಸ್ಥಾಪನೆ ವರ್ಷ
    state_of_the_est = models.CharField(max_length=255, blank=True, null=True)  # ಚೌಕಟ್ಟು / ಅಸ್ತಿತ್ವ
    head_quarter = models.CharField(max_length=500, blank=True, null=True)  # ಪ್ರಧಾನ ಕಛೇರಿಯ ಸ್ಥಳ
    # Not a URLField: entries without a document store the literal Kannada
    # placeholder "ಸಂಪಾದಿಸಬೇಕಾಗಿದೆ" (needs to be added) instead of a link.
    details_pdf = models.CharField(max_length=500, blank=True, null=True)  # ಯಕ್ಷ ಸಂಘಟನೆಯ ವಿವರಗಳಿಗಾಗಿ ಕೊಂಡಿ

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name_of_the_org or self.entry_id
