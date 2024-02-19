from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if 'access' in response.data:
            response.set_cookie('your-cookie-name', response.data['access'], httponly=True)
        return response


urlpatterns = [
    path("", views.index, name="index"),
    path("register/", views.register, name="register"),
    path("login/", TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("imLoggedIn/", views.imLoggedIn, name="im_logged_in"),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
