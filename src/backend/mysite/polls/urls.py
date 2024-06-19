from django.urls import path
from django.conf import settings
from . import views

from polls.serializers import PrivateUserInfoSerializer
from polls.models import CustomUser
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger('polls')

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Add custom logic before refreshing the token (if needed)
        response = super().post(request, *args, **kwargs)
        if 'access' in response.data:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({"message": "Refresh token is missing"}, status=400)
            try:
                decoded_refresh_token = RefreshToken(refresh_token)
                user_id = decoded_refresh_token['user_id']
                user = PrivateUserInfoSerializer(CustomUser.objects.get(id=user_id)).data
            except Exception as e:
                logger.error(f"Error decoding token or retrieving user: {e}")
                return Response({"message": "Invalid refresh token"}, status=400)

            access_token = response.data['access']
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            )
            logger.debug(f'request: {request}')
            response.data['privateUserInfo'] = user
            return response
        else:
            logger.debug('ACCESS doesn\'t exist')
            return Response({'message': "access doesn't exist"}, status=400)

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name='token_obtain_pair'),
    path('login42/', views.loginWith42Token, name='login42'),
    path('register42/', views.registerWith42Token, name='register42'),
    path("logout/", views.logout, name='logout'),
    path("delete/", views.delete, name='delete'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),

    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
    
    path("getInfo/", views.getInfo, name="get_info"),
    path("getInfo/<int:user_id>", views.getInfo, name="get_info_by_id"),
    path("checkPassword/", views.checkPassword, name="check_password"),
    path("setConfig/", views.setUserConfig, name="set_user_config"),
    path("setConfig/<int:user_id>", views.setUserConfig, name="set_user_config_by_id"),
    
    path('friends/', views.friends, name='friends'), 
    path('blockedUsers/', views.blocked_users, name='friends'),
    
    path('matches/', views.matches, name='match-list'),
    path("history/<int:user_id>", views.userHistory, name="user_history"),
    
    path('send_mail/', views.send_mail, name='send_mail'),
    path('send_mail_password/', views.send_mail_password, name='send_mail_password'),
    path('send_mail_2FA_deactivation/', views.send_mail_2FA_deactivation, name='send_mail_2FA_deactivation'),
    path('send_mail_2FA_activation/', views.send_mail_2FA_activation, name='send_mail_2FA_activation'),
    path('send_mail_new_mail/', views.send_mail_new_mail, name='send_mail_new_mail'),
    path('check_token/', views.check_token, name='check_token'),
    path('get_2FA_bool/', views.get_2FA_bool, name='get_2FA_bool'),
    path('verify_mail/', views.verify_mail, name='verify_mail')
]
