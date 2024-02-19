# Create your views here.
from django.http import HttpResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from .models import CustomUser

import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def index(request):
    return HttpResponse("hello world")

@permission_classes([IsAuthenticated])
@api_view(['GET'])
@csrf_exempt
def imLoggedIn(request):
    return JsonResponse({'message': 'you are logged'}, status=201)

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
                csrf.get_token(request)
                response.data = {"Success" : "Login successfully","data":data}
                return response
            else:
                return Response({"No active" : "This account is not active!!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"Invalid" : "Invalid username or password!!"}, status=status.HTTP_404_NOT_FOUND)
