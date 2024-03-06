from django.urls import path

from . import views

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import CustomUserView, GameHistoryView, FriendsListView

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.LoginView.as_view(), name='token_obtain_pair'),
    path('login42/', views.loginWith42Token, name='login42'),
    path('register42/', views.registerWith42Token, name='register42'),
    path("logout/", views.logout, name='logout'),
    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
    path("getInfo/", views.getInfo, name="get_info"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/<int:user_id>/', CustomUserView.as_view(), name='user_info'),
    path('player_games/<int:user_id>/', GameHistoryView.as_view(), name='game_history'),
    path('player_games/', GameHistoryView.as_view(), name='game_history'), 
    path('friends/<int:user_id>/', FriendsListView.as_view(), name='friends_list'),
   
]

