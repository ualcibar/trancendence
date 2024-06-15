# Create your views here.
from django.http import HttpResponse, JsonResponse

from django.conf import settings

from django.db import IntegrityError

from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login

import base64
from django.core.files.base import ContentFile
from rest_framework.parsers import JSONParser
from PIL import Image
from io import BytesIO
import os
import uuid


from django.utils import timezone

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .authenticate import CustomAuthentication
from .serializers import UserInfoSerializer, LightUserInfoSerializer, PrivateUserInfoSerializer
from .models import CustomUser, CustomUserManager
from matchmaking.models import Match
from matchmaking.serializers import MatchSerializer

import requests
import json
import logging
import uuid
import hashlib
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
    Obtiene el endpoint para la información del usuario.

    PARAMS:
    - Se le puede pasar la Id del usuario en la URL
    RETURN:
    - 200, 401, 404
    '''
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)

    if user_id is not None:
        try:
            response = Response({'userInfo' : UserInfoSerializer(CustomUser.objects.get(id=user_id)).data})
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    else:
        try:
            response = Response({'privateUserInfo' : PrivateUserInfoSerializer(request.user).data})
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)
    response.status = 200
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkInfo(request):
    current_password = request.POST.get('currentPass')
    user = request.user
    if user.check_password(current_password):
        return JsonResponse({'message': 'The password is correct'}, status=201)
    else:
        return JsonResponse({'status': 'error', 'message': 'The password its not the same'}, status=400)

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
    try:
        user = CustomUser.objects.get(is_42_user=True, id42=response42Json['id'])
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'This user does not exist!'}, status=404)
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
            response.data = {"Success": "Login successfully", "data": data, 'privateUserInfo' : PrivateUserInfoSerializer(user).data}
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
def logout(request):
    response = JsonResponse({'message': 'See you later!'}, status=201)
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
    response.delete_cookie('refresh_token')
    return response

@api_view(['DELETE'])
def delete(request):
    try:
        user = CustomUser.objects.get(username=request.user.username)

        response = JsonResponse({'message': 'Account deletion complete'}, status=201)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie('refresh_token')
        user.delete()

        logger.debug(f'{user.username} Account deletion success')
        return response
    except CustomUser.DoesNotExist:
        logger.debug('Account deletion request failed: The user does not exist')
        return JsonResponse({'message': 'This user does not exist!'}, status=404)

@api_view(['POST'])
@authentication_classes([])
def register(request):
    logger.debug('Registration request received')
    data = json.loads(request.body)
    username = data.get('username', '')
    password = data.get('password', '')
    email = data.get('email', '')
    if username and password and email:
        try:
            user = CustomUser.objects.create_user(
                username=username, email=email, password=password)
            fernet_obj = mail.generateFernetObj()
            token_url = mail.generate_token()
            mail.send_Verification_mail(mail.generate_verification_url(mail.encript(token_url, fernet_obj), mail.encript(username, fernet_obj)), email)
        except IntegrityError as e:
            if 'duplicate key' in str(e):
                return JsonResponse({'message': 'This username already exists!'}, status=400)
            else:
                return JsonResponse({'message': 'An error occurred while registering the user.'}, status=500)
        update_last_login(None, user)
        return JsonResponse({'message': 'User successfully registered!'}, status=201)
    else:
        return JsonResponse({'reason': 'Username and password are required!'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matches(request):
    match_ids = request.query_params.get('ids')
    if match_ids:
        match_ids_list = match_ids.split(',')  # Split the comma-separated string into a list
        matches = Match.objects.filter(id__in=match_ids_list)
    else:
        matches = Match.objects.none()

    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def userHistory(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except Exception as e:
        return Response({'message': 'cant find user'}, status=500)
    matches = user.team_a_matches.all() + user.team_b_matches.all()
    serializer = MatchSerializer(matches, True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])
def login(request):
        logger.debug('Login request received')
        data = request.data
        response = Response()
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)
        privateUserInfo = PrivateUserInfoSerializer(user).data
        response = JsonResponse({'privateUserInfo' : privateUserInfo})

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

                logger.debug('Login request succeed')
                update_last_login(None, user)
                response.data = {"Success": "Login successfully", "data": data}
                token_TwoFA = mail.generate_random_verification_code(6)
                mail.send_TwoFA_mail(token_TwoFA, user.email)
                response.status = 200
                return response
            else:
                logger.debug('Login request failed: The account is not active')
                return Response({"message": "This account is not active!"}, status=400)
        else:
            logger.debug('Login request failed: Invalid username or password')
            return Response({"message": "Invalid username or password!"}, status=400)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class CustomUserView(APIView):
    def get(self, request, user_id):
        try:
            usuario = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserInfoSerializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)

 
class FriendsListView(APIView):
    def get(self, request, user_id):
        user = CustomUser.objects.get(id=user_id)
        friends = user.friends.all()
        serializer = UserInfoSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
            usernames = request.data.get('usernames', [])
            ids = []
            for username in usernames:
                id = CustomUser.objects.filter(username=username).values_list('id', flat=True).first()
                if not id:
                    continue
                ids.append(id)
            if len(ids) == 0: #or user2.DoesNotExist:
                return Response({"error": "no matching users"}, status=status.HTTP_400_BAD_REQUEST)
            user.friends.add(ids)
            friends = user.friends.all()
            serializer = UserInfoSerializer(friends, many=True)
            return Response({"message": "Friends added successfully", "friends" : serializer.data}, status=status.HTTP_201_CREATED)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setUserConfig(request, user_id=None):
    '''
    Esta función permite guardar la nueva configuración en un usuario.

    Los parametros son la 'key' y su 'value' pasados como JSON
    '''
    data = json.loads(request.body)

    if user_id is not None:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    updated_fields = []
    valid_keys = ['color', 'language', 'username', 'password', 'email', 'anonymise', 'avatarUrl']

    for key, value in data.items():
        if key not in valid_keys:
            return JsonResponse({'message': 'No valid user settings provided'}, status=400)

        if key == 'password':
            response = password_set(user, value)
            if response:
                return response
        elif key == 'anonymise':
            response = anonymise_set(user)
            if response:
                return response
        elif key == 'avatarUrl':
            response = avatar_set(user, value)
            if response:
                return response
        else:
            setattr(user, key, value)
        updated_fields.append(key)

    try:
        user.save()
    except IntegrityError as e:
        if 'duplicate key' in str(e):
            return JsonResponse({'message': 'This username already exists!'}, status=400)
        else:
            return JsonResponse({'message': 'An error occurred while updating user settings.'}, status=500)
    privateUserInfo = PrivateUserInfoSerializer(user)
    logger.debug(f"SETUSERCONFIG: Actualizada la key {key} a {value}")
    return JsonResponse({'message': 'User settings successfully updated!', 'updated_fields': updated_fields, 'privateUserInfo' : privateUserInfo.data}, status=201)

def password_set(user, password):
    '''
    Guarda y actualiza la contraseña del usuario.
    '''
    if not password:
        return JsonResponse({'message': 'The password cannot be empty'}, status=400)
    if user.check_password(password):
        return JsonResponse({'message': 'Your new password cannot be the same as the current password'}, status=400)
    user.set_password(password)
    logger.debug(f"SETUSERCONFIG: Actualizada la contraseña del usuario {user.username}")
    return None

def anonymise_set(user):
    '''
    Anonimiza los datos del usuario y desactiva la cuenta.
    '''
    if not user.is_anonymized:
        random_str = str(uuid.uuid4())
        hashed_username = hashlib.md5(random_str.encode()).hexdigest()[:8]
        user.username = f"user_{hashed_username}"
        user.email = f"{user.username}@spacepong.me"

        user.is_anonymized = True
        user.is_active = False
        user.anonymized_at = timezone.now()
        logger.debug(f"SETUSERCONFIG: La cuenta {user.username} ha sido deshabilitada y anonimizada")
    else:
        logger.debug(f"SETUSERCONFIG: El usuario ya está anonimizado")
        return JsonResponse({'message': 'The user is already anonymised'}, status=400)
    return None

def avatar_set(user, image_data):
    '''
    Guarda y actualiza una nueva foto de perfil para el usuario
    '''
    if not image_data:
        return JsonResponse({'message': 'No image provided'}, status=400)

    # Decode the base64 string
    if (image_data == 'default'):
        avatars_dir = os.path.join('avatars', 'default.jpg')
        setattr(user,'avatar',avatars_dir)
        return None

    format, imgstr = image_data.split(';base64,')
    ext = format.split('/')[-1]  # Extract the image format
    if not ext:
        return JsonResponse({'message': 'No image extension provided'}, status=400)

    supported_formats = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG"}
    if ext not in supported_formats:
        return JsonResponse({'error': 'Unsupported image format'}, status=400)

    # Convert base64 string to image
    img_data = base64.b64decode(imgstr)
    img = Image.open(BytesIO(img_data))

    # Generate a unique file name
    file_name = f"{uuid.uuid4()}.{ext}"
    avatars_dir = os.path.join('avatars', file_name)
    file_path = os.path.join(settings.MEDIA_ROOT, avatars_dir)
    try:
        if (user.avatar != 'avatars/default.jpg'):
            user.avatar.delete(save=False)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Ensure the directory exists
        with open(file_path, 'wb') as f:
            img.save(f, format=supported_formats[ext])
            #return JsonResponse({'message': 'Image uploaded successfully', 'file_name': avatars_dir})
        user.avatar = avatars_dir
        setattr(user,'avatar',avatars_dir)
    except Exception as e: 
        logger.error(f"SETUSERCONFIG: Error saving image: {e}")
        return JsonResponse({'error': 'Failed to save image'}, status=500)