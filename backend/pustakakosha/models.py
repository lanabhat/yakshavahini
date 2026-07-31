from django.db import models

from core.models import CatalogEntryBase, TaxonomyBase


class Author(TaxonomyBase):
    pass


class Publisher(TaxonomyBase):
    pass


class Category(TaxonomyBase):
    pass


class Contributor(TaxonomyBase):
    pass


class PustakaKoshaEntry(CatalogEntryBase):
    ENTRY_ID_PREFIX = 'PUS'

    book_name = models.CharField(max_length=255)  # ಪುಸ್ತಕದ ಹೆಸರು
    authors = models.ManyToManyField(Author, blank=True, related_name='entries')  # ಲೇಖಕ/ಸಂಪಾದಕ
    details = models.TextField(blank=True, null=True)  # ವಿವರಗಳು
    category = models.ForeignKey(
        Category, blank=True, null=True, on_delete=models.SET_NULL, related_name='entries',
    )  # ಪುಸ್ತಕದ ವಿಭಾಗ
    publisher = models.ForeignKey(
        Publisher, blank=True, null=True, on_delete=models.SET_NULL, related_name='entries',
    )  # ಪ್ರಕಾಶಕ
    version = models.CharField(max_length=100, blank=True, null=True)  # ಆವೃತ್ತಿ
    year = models.CharField(max_length=50, blank=True, null=True)  # ಪ್ರಕಾಶನ ಕಾಲ
    isbn = models.CharField(max_length=50, blank=True, null=True)  # ಪುಸ್ತಕದ ಐ.ಎಸ್.ಬಿ.ಎನ್
    pdf_link = models.URLField(blank=True, null=True)  # ಪುಸ್ತಕದ ಕೊಂಡಿ
    contributors = models.ManyToManyField(
        Contributor, blank=True, related_name='entries',
    )  # ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು
    date_added = models.CharField(max_length=50, blank=True, null=True)  # ಕೋಶಕ್ಕೆ ಸೇರಿಸಲ್ಪಟ್ಟ ದಿನಾಂಕ
    date_added_english = models.DateField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)  # ಸಾರಾಂಶ
    more_details = models.TextField(blank=True, null=True)  # ಹೆಚ್ಚಿನ ವಿವರ — boosts free-text search
    # ಮುಖಚಿತ್ರ (thumbnail) — for now just a pasted Drive/direct image URL, same
    # manual-paste pattern as pdf_link. Uploading straight from the admin
    # (e.g. to Supabase storage) is a later enhancement, not built here.
    thumbnail = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.book_name or self.entry_id
