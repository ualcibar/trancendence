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
from matchmaking.models import Match
from matchmaking.serializers import MatchSerializer
from .forms import UserConfigForm, UserLoginForm, UserRegisterForm, UsernameForm,PasswordForm,EmailForm,LanguageForm,ColorForm, EmailTokenForm, EmailVerificationTokenForm,VerifyEmailViewForm, SendMailNewMailViewForm

import requests
import json
import logging
import uuid
import hashlib
from . import mail

logger = logging.getLogger('std')
token_fernet = mail.generateFernetObj()

ip = os.environ.get('IP')


def getOauth2Token(code : str):
    logger.debug(f'ip is {ip} {type(code)}')
    sendJson = {}
    sendJson['code'] = str(code)
    sendJson['client_id'] = os.getenv('ID42')
    sendJson['client_secret'] = os.getenv('SECRET42')
    sendJson['redirect_uri'] = f'https://{ip}:1501'
    sendJson['grant_type'] = 'authorization_code'
    url = 'https://api.intra.42.fr/oauth/token'
    headers = {'Content-Type': 'application/json'}
    logger.debug(f'info {sendJson}')
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
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)

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
@authentication_classes([CustomAuthentication])
def checkPassword(request):
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    password_form = PasswordForm(data)
    if not password_form.is_valid():
        return JsonResponse({'message': 'invalid form', 'errors token' : password_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    user = request.user
    if user.check_password(data['password']):
        return JsonResponse({'message': 'The password is correct'}, status=201)
    else:
        return JsonResponse({'status': 'error', 'message': 'The password its not the same'}, status=400)

@api_view(['POST'])
def loginWith42Token(request):
    logger.debug('login with 42')
    code = request.data.get('code')
    if code is None:
        logger.debug('\tyou didn\'t pass a code')
        return JsonResponse({'message': 'no code passed'}, status=400)
    logger.debug(f"code is {code}")
    response = getOauth2Token(code)
    if response.status_code != 200:
        return JsonResponse({'message': 'failed to get token'}, status=400)
    logger.debug('\tsuccess')
    logger.debug(response.json())
    token = response.json()['access_token']
    url = 'https://api.intra.42.fr/v2/me'
    headers = {"Authorization": f"Bearer {token}"}
    response42 = requests.get(url, headers=headers)
    if response42.status_code != 200:
        logger.debug(f"\tError getting me info: {response42.status_code}")
        return JsonResponse({'message': 'failed to get me info'}, status=400)
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
                return Response({"message": "couldn't get token for user"}, status=400)
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


@api_view(['GET', 'POST', 'DELETE'])
@authentication_classes([CustomAuthentication])
def friends(request):
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if request.method == 'GET': 
        friends = request.user.friends.all()
        serializer = UserInfoSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
        friend_id = data.get('friend_id')
        if friend_id is None:
            return JsonResponse({'message': 'no friend_id passed'},  status=status.HTTP_400_BAD_REQUEST)
        try:
            friend = CustomUser.objects.get(id=friend_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Friend not found"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.friends.add(friend)
        serializer = UserInfoSerializer(request.user.friends.all(), many=True)
        return Response({"message": "Friends added successfully", "friends": serializer.data}, status=status.HTTP_200_OK)
    elif request.method == 'DELETE':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
        friend_id = data.get('friend_id')
        if friend_id is None:
            return JsonResponse({'message': 'no friend_id passed'},  status=status.HTTP_400_BAD_REQUEST)
        try:
            friend = request.user.friends.get(id=friend_id)
            if friend is None:
                return JsonResponse({'message': 'friend_id is not a friend'},  status=status.HTTP_400_BAD_REQUEST)

        except CustomUser.DoesNotExist:
            return Response({"error": "Friend not found"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.friends.remove(friend)
        serializer = UserInfoSerializer(request.user.friends.all(), many=True)
        return Response({"message": "Friends added successfully", "friends": serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST', 'DELETE'])
@authentication_classes([CustomAuthentication])
def blocked_users(request):
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if request.method == 'GET':
        friends = request.user.friends.all()
        serializer = UserInfoSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
        blocked_user_id = data.get('blocked_user_id')
        if blocked_user_id is None:
            return JsonResponse({'message': 'no blocked_user_id passed'},  status=status.HTTP_400_BAD_REQUEST)
        try:
            blocked_user = CustomUser.objects.get(id=blocked_user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.blockedUsers.add(blocked_user)
        serializer = UserInfoSerializer(request.user.blockedUsers.all(), many=True)
        return Response({"message": "User blocked successfully", "blockedUsers": serializer.data}, status=status.HTTP_200_OK)
    elif request.method == 'DELETE':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
        blocked_user_id = data.get('friend_id')
        if blocked_user_id is None:
            return JsonResponse({'message': 'no blocked_user_id passed'},  status=status.HTTP_400_BAD_REQUEST)
        try:
            blocked_user = request.user.blockedUsers.get(id=blocked_user_id)
            if blocked_user is None:
                return JsonResponse({'message': 'friend_id is not a friend'},  status=status.HTTP_400_BAD_REQUEST)

        except CustomUser.DoesNotExist:
            return Response({"error": "BlockedUser not found"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.blockedUsers.remove(blocked_user)
        serializer = UserInfoSerializer(request.user.blockedUsers.all(), many=True)
        return Response({"message": "User unblocked successfully", "blockedUsers": serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
def registerWith42Token(request):
    logger.debug('42register')
    code = request.data.get('code')
    if code is None:
        logger.debug('\tyou didn\'t pass a code')
        return JsonResponse({'message': 'no code passed'}, status=400)
    logger.debug(f"code is {code}")
    response = getOauth2Token(code)
    if response.status_code != 200:
        return JsonResponse({'message': f"failed to get token\n{response.json()}"}, status=400)
    logger.debug('\t42 register success')
    logger.debug(response.json())
    token = response.json()['access_token']
    url = 'https://api.intra.42.fr/v2/me'
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        logger.debug(f"\tError getting me info: {response.status_code}")
        return JsonResponse({'message': 'failed to get me info'}, status=400)
    logger.debug(f"\tcontent = {response.json()}")
    try :
        CustomUser.objects.create42user(response.json())
    except Exception as e:
        return JsonResponse({'message': 'failed to create user'}, status=400)
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

#todo
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete(request):
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
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
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    
    form = UserRegisterForm(data)
    if form.is_valid():
        try:
            username = data.get('username', '')
            password = data.get('password', '')
            email = data.get('email', '')
            token_verification = mail.generate_token()
            user = CustomUser.objects.create_user(
                username=username, email=email, password=password, token_verification=token_verification)
            mail.send_Verification_mail(mail.generate_verification_url(mail.encript(token_verification, token_fernet), mail.encript(username, token_fernet)), email)
        except IntegrityError as e:
            if 'duplicate key' in str(e):
                return JsonResponse({'message': 'This username already exists!'}, status=400)
            else:
                return JsonResponse({'message': 'An error occurred while registering the user.'}, status=400)
        update_last_login(None, user)
        return JsonResponse({'message': 'User successfully registered!'}, status=201)
    else:
        return JsonResponse({'message': 'Invalid form!'}, status=400)

#!todo
@api_view(['GET'])
@authentication_classes([CustomAuthentication])
def matches(request):
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
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
        return Response({'message': 'cant find user'}, status=400)
    matches = user.team_a_matches.all() + user.team_b_matches.all()
    serializer = MatchSerializer(matches, True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])
def login(request):
        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
        form = UserLoginForm(data) 
        if not form.is_valid():
            return JsonResponse({'message': 'invalid form', 'errors' : form.errors},  status=status.HTTP_400_BAD_REQUEST)
        username = data.get('username', '')
        password = data.get('password', '')
        user = authenticate(username=username,password=password)
        if user is not None:
            privateUserInfo = PrivateUserInfoSerializer(user).data
            response = JsonResponse({'privateUserInfo' : privateUserInfo})
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
                if customUser.verification_bool == False :
                    return Response({"message": "Email hasn't been verificated, unsuccesful login"}, status=400)
                update_last_login(None, user)
                response.data = {"Success": "Login successfully", "data": data}
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

 
@api_view(['POST'])
@authentication_classes([CustomAuthentication])
def setUserConfig(request):
    '''
    Esta función permite guardar la nueva configuración en un usuario.

    Los parametros son la 'key' y su 'value' pasados como JSON
    '''
    if request.user is None:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'You must login to see this page!'}, status=401)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    user : CustomUser = request.user

    if user.status != CustomUser.CONNECTED:
        return JsonResponse({'message': 'user must be connected. not ingame, joining or disconnected'},  status=status.HTTP_400_BAD_REQUEST)

    form = UserConfigForm(data)
    if not form.is_valid():
        return JsonResponse({'message': 'invalid form', 'errors' : form.errors},  status=status.HTTP_400_BAD_REQUEST)

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
            return JsonResponse({'message': 'An error occurred while updating user settings.'}, status=400)
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
    if image_data == 'default':
        del_user_image(user)
        #user.avatar =  'avatars/default.jpg'
        avatars_dir = os.path.join('avatars', 'default.jpg')
        setattr(user,'avatar',avatars_dir)
        return


    # Decode the base64 string
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
        os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Ensure the directory exists
        with open(file_path, 'wb') as f:
            img.save(f, format=supported_formats[ext])
            #return JsonResponse({'message': 'Image uploaded successfully', 'file_name': avatars_dir})
        del_user_image(user)
        #user.avatar = avatars_dir
        setattr(user,'avatar',avatars_dir)
    except Exception as e:
        logger.error(f"SETUSERCONFIG: Error saving image: {e}")
        return JsonResponse({'error': 'Failed to save image'}, status=400)
    logger.debug(f"SETUSERCONFIG: Actualizada la foto de perfil del usuario {user.username}")

def del_user_image(user : CustomUser) -> bool:
    if user.avatar == 'avatars/default.jpg':
        return False
    user.avatar.delete(save=False)
    return True

@api_view(['POST'])
@authentication_classes([])
def send_mail(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    username_form = UsernameForm(data)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    username = data['username']
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\'t exist'}, status=400)
    
    token_TwoFA = mail.generate_random_verification_code(6)
    email = user.email
    if email == None:
        return JsonResponse({'message': 'Email not found!'}, status=400)
    mail.send_TwoFA_mail(token_TwoFA, email)
    user.token_2FA = token_TwoFA
    user.save()
    return JsonResponse({'message': 'Email sent!'}, status=201)

@api_view(['POST'])
@authentication_classes([])
def send_mail_2FA_activation(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    username_form = UsernameForm(data)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    username = data['username']
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\'t exist'}, status=400)
    
    token_TwoFA = mail.generate_random_verification_code(6)
    email = user.email
    if email == None:
        return JsonResponse({'message': 'Email not found!'}, status=400)
    mail.send_TwoFA_Activation_mail(token_TwoFA, email)
    user.token_2FA = token_TwoFA
    user.save()
    return JsonResponse({'message': 'Email sent!'}, status=201)

@api_view(['POST'])
@authentication_classes([])
def send_mail_password(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    
    username_form = UsernameForm(data)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    username = data['username']
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\'t exist'}, status=400)
    
    email = user.email
    if email == None:
        return JsonResponse({'message': 'Email not found!'}, status=400)
    mail.send_password_mail(email)
    return JsonResponse({'message': 'Email sent!'}, status=201)

@api_view(['POST'])
@authentication_classes([])
def send_mail_2FA_deactivation(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    
    username_form = UsernameForm(data)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    username = data['username']
    
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\'t exist'}, status=400)
    email = user.email
    if email == None:
        return JsonResponse({'message': 'Email not found!'}, status=400)
    mail.send_TwoFA_Deactivation_mail(email)
    user.is_2FA_active = False
    user.save()
    return JsonResponse({'message': 'Email sent!'}, status=201)


@api_view(['POST'])
def check_token(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    
    token_form = EmailTokenForm(data)
    username_form = UsernameForm(data)
    if not token_form:
        return JsonResponse({'message': 'invalid form', 'errors token' : token_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    
    username = data['username']
    token = data['token']

    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\' exist'}, status=400)
    if user.token_2FA == token:
        user.token_2FA = ''
        if user.is_2FA_active == True :
            user.is_2FA_active = False
        else :
            user.is_2FA_active = True
        user.save()
        return JsonResponse({'message': 'The Token is correct'}, status=201)
    else:
        return JsonResponse({'status': 'error', 'message': 'The token its not the same'}, status=400)
 
@api_view(['POST'])
@authentication_classes([])
def check_token_login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    token_form = EmailTokenForm(data)
    username_form = UsernameForm(data)
    if not token_form:
        return JsonResponse({'message': 'invalid form', 'errors token' : token_form.errors},  status=status.HTTP_400_BAD_REQUEST)
    if not username_form:
        return JsonResponse({'message': 'invalid form', 'errors username' : username_form.errors},  status=status.HTTP_400_BAD_REQUEST)

    username = data['username']
    token = data['token']

    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\' exist'}, status=400)
    if user.token_2FA == token:
        user.token_2FA = ''
        user.save()
        return JsonResponse({'message': 'The Token is correct'}, status=201)
    else:
        return JsonResponse({'status': 'error', 'message': 'The token its not the same'}, status=400)

@api_view(['POST'])
@authentication_classes([])
def get_2FA_bool(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    form = UsernameForm(data)
    if not form.is_valid():
        return JsonResponse({'message': 'invalid form', 'errors' : form.errors},  status=status.HTTP_400_BAD_REQUEST)

    try:
        customUser = CustomUser.objects.get(username=data['username'])
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\' exist'}, status=400)
    if customUser.is_2FA_active == True :
        return JsonResponse({'message': 'true'}, status=201)
    if customUser.is_2FA_active == False :
        return JsonResponse({'message': 'false'}, status=201)

@api_view(['POST'])
@authentication_classes([])
def verify_mail(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)

    form = VerifyEmailViewForm(data)
    if not form.is_valid():
        return JsonResponse({'message': 'invalid form', 'errors' : form.errors},  status=status.HTTP_400_BAD_REQUEST)

    try:
        token = mail.desencript(data['encripted_token'], token_fernet)
        username = mail.desencript(data['encripted_username'], token_fernet)
    except Exception as e:
        return JsonResponse({'message': 'invalid encription'},  status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\' exist'}, status=400)
    if user.token_verification == token:
        user.token_verification = ''
        user.verification_bool = True
        user.save()
        return JsonResponse({'message': 'The Token is correct'}, status=201)
    else:
        return JsonResponse({'status': 'error', 'message': 'The token its not the same'}, status=400)
    
@api_view(['POST'])
@authentication_classes([])
def send_mail_new_mail(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'invalid json'},  status=status.HTTP_400_BAD_REQUEST)
    form = SendMailNewMailViewForm(data)
    if not form.is_valid():
        return JsonResponse({'message': 'invalid form', 'errors' : form.errors},  status=status.HTTP_400_BAD_REQUEST)

    username = data['username']
    old_mail = data['old_mail']
    new_mail = data['new_mail']
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return JsonResponse({'message': 'User doesn\' exist'}, status=400)
    token_verification = mail.generate_token()
    mail.send_Verification_mail(mail.generate_verification_url(mail.encript(token_verification, token_fernet), mail.encript(username, token_fernet)), new_mail)
    user.token_verification = token_verification
    mail.send_NoLongerSpacepong_mail(old_mail)
    user.verification_bool = False
    user.save()
    return JsonResponse({'message': 'Email sent!'}, status=201)
