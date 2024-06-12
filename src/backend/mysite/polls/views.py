# Create your views here.
from django.http import HttpResponse
from django.http import JsonResponse

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
    Por que?
     - Nos permite gestionar los perfiles para mostrar su contenido en el frontend
    Funciona con usuarios solamente?
     - Para hacer llamadas para obtener solamente el usuario, también funciona.
    unai aprende ha comentar codigo:
    get endpoint for user information, user id passed on the url, codes : 200, 401,404,
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
@permission_classes([IsAuthenticated])
def setUserConfig(request, user_id=None):
    data = json.loads(request.body)

    if user_id is not None:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'This user does not exist!'}, status=404)

    updated_fields = []
    valid_keys = ['color', 'language', 'username', 'password', 'email', 'anonymise', 'avatarUrl']

    for key, value in data.items():
        if key in valid_keys:
            if key == 'password':
                if not value:
                    return JsonResponse({'message': 'The password cannot be empty'}, status=400)
                if user.check_password(value):
                    return JsonResponse({'message': 'Your new password cannot be the same as the current password'}, status=400)
                user.set_password(value)
                updated_fields.append(key)
                logger.debug(f"Actualizada la key {key}")
            if key == 'anonymise':
                if not user.is_anonymized:
                    random_str = str(uuid.uuid4())
                    hashed_username = hashlib.md5(random_str.encode()).hexdigest()[:8]
                    user.username = f"user_{hashed_username}"
                    user.email = f"{user.username}@spacepong.me"

                    user.is_anonymized = True
                    user.is_active = False
                    user.anonymized_at = timezone.now()
                    logger.debug(f"La cuenta {user.username} ha sido deshabilitada y anonimizada")
                    updated_fields.append(key)
                else:
                    logger.debug(f"El usuario ya está anonimizado")
            if key == 'avatarUrl':
                image_data = value
                if not image_data:
                    return JsonResponse({'message': 'No image provided'}, status=400)
                
                # Decode the base64 string
                format, imgstr = image_data.split(';base64,') 
                ext = format.split('/')[-1]  # Extract the image format
                if not ext:
                    return JsonResponse({'message': 'No image extension provided'}, status=400)

                supported_formats = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "gif": "GIF", "bmp": "BMP", "tiff": "TIFF", "webp": "WEBP", "ico": "ICO"}
                if ext not in supported_formats:
                    return JsonResponse({'error': 'Unsupported image format'}, status=400)
                logger.debug(f"ext '{ext}', format '{format}'")

                # Convert base64 string to image
                img_data = base64.b64decode(imgstr)
                img = Image.open(BytesIO(img_data))

                # Generate a unique file name
                file_name = f"{uuid.uuid4()}.{ext}"
                avatars_dir = os.path.join('avatars', file_name)
                file_path = os.path.join(settings.MEDIA_ROOT, avatars_dir)
                try:
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Ensure the directory exists
                    with open(file_path, 'wb') as f:
                        img.save(f, format=supported_formats[ext])
                        #return JsonResponse({'message': 'Image uploaded successfully', 'file_name': avatars_dir})
                        setattr(user,'avatar',avatars_dir)
                except Exception as e:
                    logger.error(f"Error saving image: {e}")
                    return JsonResponse({'error': 'Failed to save image'}, status=500)
            else:
                setattr(user, key, value)
                updated_fields.append(key)
                logger.debug(f"Actualizada la key {key} a {value}")
        else:
            return JsonResponse({'message': 'No valid user settings provided'}, status=400)

    try:
        user.save()
    except IntegrityError as e:
        if 'duplicate key' in str(e):
            return JsonResponse({'message': 'This username already exists!'}, status=400)
        else:
            return JsonResponse({'message': 'An error occurred while updating user settings.'}, status=500)
    privateUserInfo = PrivateUserInfoSerializer(user)
    return JsonResponse({'message': 'User settings successfully updated!', 'updated_fields': updated_fields, 'privateUserInfo' : privateUserInfo.data}, status=201)

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

class GameHistoryView(APIView):
    def get(self, request, user_id):
        player1_games = Game.objects.filter(player1_id=user_id)
        player2_games = Game.objects.filter(player2_id=user_id)

        all_games = player1_games | player2_games
        #serialized_games = GameSerializer(all_games, many = True)
        return Response(None, status=status.HTTP_200_OK)
    
    def post(self, request):
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        
        serializer = GameSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        
    
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
