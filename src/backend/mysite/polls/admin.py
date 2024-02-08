from django.contrib import admin

from .models import CustomUser, Game, Tournament

admin.site.register(CustomUser)
admin.site.register(Game)
admin.site.register(Tournament)
# Register your models here.
