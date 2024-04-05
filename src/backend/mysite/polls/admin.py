from django.contrib import admin

from .models import CustomUser, Game, Tournament

admin.site.register(CustomUser)
admin.site.register(Game)
# Register your models here.
