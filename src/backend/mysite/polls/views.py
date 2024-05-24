# Create your views here.
from django.http import HttpResponse
from django.http import JsonResponse

from django.conf import settings

from django.db import IntegrityError

from django.contrib.auth import authenticate

from django.middleware import csrf

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .authenticate import CustomAuthentication
from .serializers import UserSerializer, CustomUserSerializer, GameSerializer, TournamentSerializer, FriendSerializer
from .models import CustomUser, Game, Tournament, CustomUserManager

import requests
import json
import logging
from . import mail

logger = logging.getLogger('std')

def getOauth2Token(code):
    sendJson = {'code': code}
    sendJson ['client_id'] = 'u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87'
    sendJson['client_secret'] = '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'
    sendJson['redirect_uri'] = 'https://localhost'
    sendJson['grant_type'] = 'authorization_code'
    url = 'https://api.intra.42.fr/oauth/token'
    headers = {'Content-Type': 'application/json'}
    return requests.post(url, json=sendJson, headers=headers)


@api_view(['GET'])
@authentication_classes([CustomAuthentication])
def getInfo(request, user_id=None):
    '''
    Esta función acepta también el valor de ID.
    Por que?
     - Nos permite gestionar los perfiles para mostrar su contenido en el frontend
    Funciona con usuarios solamente?
     - Para hacer llamadas para obtener solamente el usuario, también funciona.
    unai aprende ha comentar codigo:
    get endpoint for user information, user id passed on the url, codes : 200, 401,404,
    '''
    friends = user.friends.all()
    ''' friend_serializer = FriendSerializer(friends, many=True) '''
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)

    if user_id is not None:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    else:
        try:
            user = CustomUser.objects.get(username=request.user.username)
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    return JsonResponse({
        'username': user.username,
        'userid': user.id,
        'status': user.status,
        'total': user.total,
        'wins': user.wins,
        'defeats': user.loses,
        'status': user.status,
        'color': user.user_color,
        'language': user.user_language,
        'friend' : friend_serializer
        }, status=200)

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
                return Response({"message": "couldn't get token for user"}, status=500)
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
            return Response({"No active": "This account is not active!"}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({"Invalid": "Invalid username!"}, status=status.HTTP_404_NOT_FOUND)


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
@permission_classes([IsAuthenticated])
def imLoggedIn(request):
    return JsonResponse({'message': 'You are logged in'}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setUserConfig(request, user_id=None):
    data = json.loads(request.body)

    if user_id is not None:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    updated_fields = []
    valid_keys = ['user_color', 'user_language', 'username']

    for key, value in data.items():
        if key in valid_keys:
            setattr(user, key, value)
            updated_fields.append(key)
            logger.debug(f"Actualizada la key {key} a {value}")

    if not valid_keys:
        return JsonResponse({'message': 'No valid user settings provided'}, status=400)

    try:
        user.save()
    except IntegrityError as e:
        if 'duplicate key' in str(e):
            return JsonResponse({'message': 'This username already exists!'}, status=400)
        else:
            return JsonResponse({'message': 'An error occurred while updating user settings.'}, status=500)

    return JsonResponse({'message': 'User settings successfully updated!', 'updated_fields': updated_fields}, status=201)

@api_view(['POST'])
def logout(request):
    response = JsonResponse({'message': 'See you later!'}, status=201)
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
    response.delete_cookie('refresh_token')
    return response

@api_view(['POST'])
@authentication_classes([])
def register(request):
    data = json.loads(request.body)
    username = data.get('username', '')
    password = data.get('password', '')
    email = data.get('email', '')
    if username and password and email:
        user = CustomUser.objects.create_user(
            username=username, email=email, password=password)
        fernet_obj = mail.generateFernetObj()
        token_url = mail.generate_token()
        mail.send_Verification_mail(mail.generate_verification_url(mail.encript(token_url, fernet_obj), mail.encript(username, fernet_obj)), email)
        return JsonResponse({'message': 'User successfully registered!'}, status=201)
    else:
        return JsonResponse({'reason': 'Username and password are required!'}, status=400)


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


@api_view(['POST'])
@authentication_classes([])
def login(request):
        logger.debug('login request received')
        data = request.data
        response = Response()
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                refresh = RefreshToken.for_user(user)
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value=refresh.access_token,
                    expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                )
                response.set_cookie(
                    key='refresh_token',
                    value=refresh,
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                )
                # csrf.get_token(request)

                try:
                    customUser = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    return JsonResponse({'message': 'This user does not exist!'}, status=404)
                
                response.data = {"Success": "Login successfully", "data": data}
                token_TwoFA = mail.generate_random_verification_code(6)
                logger.debug(f"QUE ES ESTOOOoOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO {customUser.email}")
                mail.send_TwoFA_mail(token_TwoFA, customUser.email)
                return response
            else:
                return Response({"message": "This account is not active!"}, status=500)
        else:
            return Response({"message": "Invalid username or password!"}, status=500)

class CustomUserView(APIView):
    def get(self, request, user_id):
        try:
            usuario = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CustomUserSerializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GameHistoryView(APIView):
    def get(self, request, user_id):
        player1_games = Game.objects.filter(player1_id=user_id)
        player2_games = Game.objects.filter(player2_id=user_id)

        all_games = player1_games | player2_games
        serialized_games = GameSerializer(all_games, many = True)
        return Response(serialized_games, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        
    
class FriendsListView(APIView):
    def get(self, request, user_id):
        user = CustomUser.objects.get(id=user_id)
        friends = user.friends.all()
        serializer = FriendSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_ids = request.data.get('friend_ids', [])
        user2 = CustomUser.objects.get(id=user_id)

        if not friend_ids or user2.DoesNotExist:
            return Response({"error": "Friend IDs are required"}, status=status.HTTP_400_BAD_REQUEST)

        friends = CustomUser.objects.filter(id__in=friend_ids)
        user.friends.add(*friends)
        user.save()
        return Response({"message": "Friends added successfully"}, status=status.HTTP_201_CREATED)

class FriendsView(APIView):
    def get(self, request, user_id, friend_id):
        user = CustomUser.objects.get(id=user_id)
        friends = user.friends.get(id=friend_id)
        serializer = CustomUserSerializer(friends, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, user_id, friend_id):
        user = CustomUser.objects.get(id=user_id)
        friend_ids = user.friends.get(id=friend_id)
        user2 = CustomUser.objects.get(id=user_id)

        if user2.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
        if not friend_ids.DoesNotExist:
            return Response({"error": "Friend already add"}, status=status.HTTP_400_BAD_REQUEST)
        
        friends = CustomUser.objects.filter(id__in=friend_id)
        user.friends.add(*friends)
        user.save()
        return Response({"message": "Friends added successfully"}, status=status.HTTP_201_CREATED)


# File uploading management
def upload_file(request):
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            handle_uploaded_file(request.FILES["file"])
            return HttpResponseRedirect("/success/url/")
    else:
        form = UploadFileForm()
    return render(request, "upload.html", {"form": form})