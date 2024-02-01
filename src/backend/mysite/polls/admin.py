from django.contrib import admin

from .models import Match, MatchState, CustomUser

admin.site.register(CustomUser)
admin.site.register(Match)
admin.site.register(MatchState)
# Register your models here.
