from django.urls import path

from . import views

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.LoginView.as_view(), name='token_obtain_pair'),
    path('login42/', views.loginWith42Token, name='login42'),
    path('register42/', views.registerWith42Token, name='register42'),
    path("logout/", views.logout, name='logout'),
    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
    path("getInfo/", views.getInfo, name="get_info"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
