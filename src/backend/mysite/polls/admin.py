from django.contrib import admin

from .models import CustomUser



@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'get_team_a_matches', 'get_team_b_matches']

    def get_team_a_matches(self, obj):
        return ", ".join([match.__str__() for match in obj.team_a_matches.all()])

    get_team_a_matches.short_description = 'Team A Matches'

    def get_team_b_matches(self, obj):
        return ", ".join([match.__str__() for match in obj.team_b_matches.all()])

    get_team_b_matches.short_description = 'Team B Matches'

# Register your models here.
