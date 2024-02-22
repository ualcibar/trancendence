# Create your views here.
from django.http import HttpResponse
from django.http import JsonResponse

from django.conf import settings

from django.views.decorators.csrf import csrf_exempt

from django.contrib.auth import authenticate

from django.middleware import csrf

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response

from .authenticate import CustomAuthentication

from .models import CustomUser

import json
import logging

logger = logging.getLogger('polls')


@api_view(['GET'])
@authentication_classes([CustomAuthentication])
@permission_classes([IsAuthenticated])
def index(request):
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'you are not logged in'}, status=403)
    return HttpResponse("hello world")


@api_view(['GET'])
@authentication_classes([CustomAuthentication])
def imLoggedIn(request):
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'you are not logged in'}, status=403)
    logger.debug('im logged called')
    return JsonResponse({'message': 'you are logged'}, status=201)

@csrf_exempt
@api_view(['POST'])
def logout(request):
    response = JsonResponse({'message': 'test'}, status=201)
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE']) 
    return response

@csrf_exempt
@api_view(['POST'])
def register(request):
    data = json.loads(request.body)
    username = data.get('username', '')
    password = data.get('password', '')
    if username and password:
        user = CustomUser.objects.create_user(username=username, password=password)
        return JsonResponse({'message': 'User registered successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Username and password are required'}, status=400)


#@csrf_exempt
#@api_view(['POST'])
#def user_login(request):
#    if request.method == 'POST':
#        data = json.loads(request.body)
#        username = data.get('username')
#        password = data.get('password')
#        if username and password:
#            user = authenticate(request, username=username, password=password)
#            if user is not None:
#                login(request, user)
#                refresh = RefreshToken.for_user(user)
#                data = {
#                    'refresh': str(refresh),
#                    'access': str(refresh.access_token),
#                }
#                return JsonResponse({'message': 'Login successful', 'data': data}, status=200)
                #request.session["username"] = user.username
                #return JsonResponse({'message': 'Login successful', 'sessionid': request.session.session_key}, status=200)
#            else:
#                return JsonResponse({'error': 'Invalid credentials'}, status=401)
#        else:
#            return JsonResponse({'error': 'Username and password are required'}, status=400)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class LoginView(APIView):
    def post(self, request, format=None):
        data = request.data
        response = Response()
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                data = get_tokens_for_user(user)
                response.set_cookie(
                    key = settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value = data["access"],
                    expires = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    secure = settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly = settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite = settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                #csrf.get_token(request)
                response.data = {"Success" : "Login successfully","data":data}
                return response
            else:
                return Response({"No active" : "This account is not active!!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"Invalid" : "Invalid username or password!!"}, status=status.HTTP_404_NOT_FOUND)
