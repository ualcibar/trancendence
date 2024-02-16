from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("register/", views.register, name="register"),
    path("login/", views.user_login, name="user_login"),
    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
]
