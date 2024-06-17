from django.contrib import admin
from matchmaking.models import MatchPreview, Player, Match
# Register your models here.
from polls.models import CustomUser

class MatchInline(admin.TabularInline):
    model = Match.team_a.through  # This is the through model for the ManyToMany relationship
    model = Match.team_b.through  # This is the through model for the ManyToMany relationship


class CustomUserAdmin(admin.ModelAdmin):
    inlines = [MatchInline]

admin.site.register(MatchPreview)
admin.site.register(Player)
admin.site.register(Match)