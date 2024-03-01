# Create your views here.
from django.http import HttpResponse
from django.http import JsonResponse

from django.conf import settings


from django.contrib.auth import authenticate

from django.middleware import csrf

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response

from .authenticate import CustomAuthentication

from .models import CustomUser

import requests
import json
import logging

logger = logging.getLogger('polls')

def getOauth2Token(code):
    sendJson = {'code': code}
    sendJson ['client_id'] = 'u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87'
    sendJson['client_secret'] = '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'
    sendJson['redirect_uri'] = 'http://localhost:4200'
    sendJson['grant_type'] = 'authorization_code'
    sendJson['redirect_uri'] = 'http://localhost:4200'
    url = 'https://api.intra.42.fr/oauth/token'
    headers = {'Content-Type': 'application/json'}
    return requests.post(url, json=sendJson, headers=headers)


@api_view(['GET'])
@authentication_classes([CustomAuthentication])
def getInfo(request): 
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'you are not logged in'}, status=403)
    return JsonResponse({'username': request.user.username}, status=200)

@api_view(['POST'])
def loginWith42Token(request):
    logger.debug('login with 42')
    code = request.data.get('code')
    if code is None:
        logger.debug('\tyou didn\'t pass a code')
        return JsonResponse({'message': 'no code passed'}, status=500)
    logger.debug(f"code is {code}")
    response = getOauth2Token(code)
    if response.status_code != 200:
        return JsonResponse({'message': 'failed to get token'}, status=500)
    logger.debug('\tsuccess')
    logger.debug(response.json())
    token = response.json()['access_token']
    url = 'https://api.intra.42.fr/v2/me'
    headers = {"Authorization": f"Bearer {token}"}
    response42 = requests.get(url, headers=headers)
    if response42.status_code != 200:
        logger.debug(f"\tError getting me info: {response42.status_code}")
        return JsonResponse({'message': 'failed to get me info'}, status=500)
    logger.debug(f"\tcontent = {response42.json()}")
    response42Json = response42.json()
    user = CustomUser.objects.get(is_42_user=True, id42=response42Json['id'])
    response = Response()
    if user is not None:
        if user.is_active:
            data = get_tokens_for_user(user)
            if data is None:
                return Response({"message": "couldn't  get token for user"}, status=500)
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=data["access"],
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            # csrf.get_token(request)
            response.data = {"Success": "Login successfully", "data": data}
            return response
        else:
            return Response({"No active": "This account is not active!!"}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({"Invalid": "Invalid username!!"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def registerWith42Token(request):
    logger.debug('42register')
    code = request.data.get('code')
    if code is None:
        logger.debug('\tyou didn\'t pass a code')
        return JsonResponse({'message': 'no code passed'}, status=500)
    logger.debug(f"code is {code}")
    response = getOauth2Token(code)
    if response.status_code != 200:
        return JsonResponse({'message': f"failed to get token\n{response.json()}"}, status=500)
    logger.debug('\t42 register success')
    logger.debug(response.json())
    token = response.json()['access_token']
    url = 'https://api.intra.42.fr/v2/me'
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logger.debug(f"\tError getting me info: {response.status_code}")
        return JsonResponse({'message': 'failed to get me info'}, status=500)
    logger.debug(f"\tcontent = {response.json()}")
    if CustomUser.objects.create42user(response.json()) is None:
        return JsonResponse({'message': 'failed to create user'}, status=500)
    return JsonResponse(response.json(), status=200)


@api_view(['GET'])
@authentication_classes([CustomAuthentication])
def imLoggedIn(request):
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'you are not logged in'}, status=403)
    return JsonResponse({'message': 'you are logged'}, status=201)


@api_view(['POST'])
def logout(request):
    response = JsonResponse({'message': 'test'}, status=201)
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
    return response


@api_view(['POST'])
def register(request):
    data = json.loads(request.body)
    username = data.get('username', '')
    password = data.get('password', '')
    if username and password:
        user = CustomUser.objects.create_user(
            username=username, password=password)
        return JsonResponse({'message': 'User registered successfully'}, status=201)
    else:
        return JsonResponse({'reason': 'Username and password are required'}, status=400)


# @csrf_exempt
# @api_view(['POST'])
# def user_login(request):
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
        # request.session["username"] = user.username
        # return JsonResponse({'message': 'Login successful', 'sessionid': request.session.session_key}, status=200)
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
                    key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value=data["access"],
                    expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                # csrf.get_token(request)
                response.data = {"Success": "Login successfully", "data": data}
                return response
            else:
                return Response({"message": "This account is not active!!"}, status=500)
        else:
            return Response({"message": "Invalid username or password!!"}, status=500)
