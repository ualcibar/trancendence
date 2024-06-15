from django.contrib import admin

from .models import CustomUser, Statistics



@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'get_team_a_matches', 'get_team_b_matches']

    def get_team_a_matches(self, obj):
        return ", ".join([match.__str__() for match in obj.team_a_matches.all()])

    get_team_a_matches.short_description = 'Team A Matches'

    def get_team_b_matches(self, obj):
        return ", ".join([match.__str__() for match in obj.team_b_matches.all()])

    get_team_b_matches.short_description = 'Team B Matches'

@admin.register(Statistics)
class StatisticsAdmin(admin.ModelAdmin):
    list_display = ['get_username']
    def get_username(self, statistics):
        return statistics.user.username
    get_username.short_description = 'Username'


# Register your models here.
