from django.urls import path
from django.conf import settings
from . import views

from rest_framework_simplejwt.views import TokenRefreshView
import logging

logger = logging.getLogger('polls')

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Add custom logic before refreshing the token (if needed)
        response = super().post(request, *args, **kwargs)
        if 'access' in response.data:
            access_token = response.data['access']
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            )
            return response
        else:
            logger.debug('ACCESS doesn\'t exist')
            return Response({message: "access doesn't exist"}, status=400)

from .views import CustomUserView, GameHistoryView, FriendsListView

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name='token_obtain_pair'),
    path('login42/', views.loginWith42Token, name='login42'),
    path('register42/', views.registerWith42Token, name='register42'),
    path("logout/", views.logout, name='logout'),
    path("delete/", views.delete, name='delete'),
    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
    path("getInfo/", views.getInfo, name="get_info"),
    path("getInfo/<int:user_id>", views.getInfo, name="get_info_by_id"),
    path("checkInfo/", views.checkInfo, name="check_info"),
    path("setConfig/", views.setUserConfig, name="set_user_config"),
    path("setConfig/<int:user_id>", views.setUserConfig, name="set_user_config_by_id"),
    #path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/<int:user_id>/', CustomUserView.as_view(), name='user_info'),
    path('player_games/<int:user_id>/', GameHistoryView.as_view(), name='game_history'),
    path('player_games/', GameHistoryView.as_view(), name='game_history'), 
    path('friends/<int:user_id>/', FriendsListView.as_view(), name='friends_list'), 
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('send_mail/', views.send_mail, name='send_mail'),
    path('send_mail_login/', views.send_mail_login, name='send_mail_login'),
    path('check_token/', views.check_token, name='check_token'),
    path('check_token_login/', views.check_token_login, name='check_token_login'),
    path('get_2FA_bool/', views.get_2FA_bool, name='get_2FA_bool'),
    path('verify_mail/', views.verify_mail, name='verify_mail')
]

