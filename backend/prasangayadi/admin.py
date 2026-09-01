from django.contrib import admin

from .models import PrasangaYadiEntry


@admin.register(PrasangaYadiEntry)
class PrasangaYadiEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'prasanga_name', 'type', 'publish_status', 'status', 'created_at')
    list_filter = ('status', 'type', 'publish_status', 'prasanga_type', 'prasanga_language')
    search_fields = ('entry_id', 'prasanga_name', 'unique_number')
