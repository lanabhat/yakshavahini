from django.contrib import admin

from .models import (
    UserProfile, DriveAccount, DriveFile, EntryEdit, DeletionRequest,
    DeletedEntry, LinkCheckRun, LinkCheckResult,
)

admin.site.register(UserProfile)
admin.site.register(DriveAccount)
admin.site.register(DriveFile)
admin.site.register(EntryEdit)
admin.site.register(DeletionRequest)
admin.site.register(DeletedEntry)
admin.site.register(LinkCheckRun)
admin.site.register(LinkCheckResult)
