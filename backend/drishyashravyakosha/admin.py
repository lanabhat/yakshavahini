from django.contrib import admin

from .models import DrishyaShravyaKoshaEntry


@admin.register(DrishyaShravyaKoshaEntry)
class DrishyaShravyaKoshaEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'subject', 'event_type', 'date_english', 'status', 'created_at')
    list_filter = ('status', 'event_type')
    search_fields = ('entry_id', 'subject', 'details')
