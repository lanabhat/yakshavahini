from django.contrib import admin

from .models import MattukoshaEntry


@admin.register(MattukoshaEntry)
class MattukoshaEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'name', 'type', 'status', 'date_english', 'created_at')
    list_filter = ('status', 'type')
    search_fields = ('entry_id', 'name', 'ragas', 'situations')
