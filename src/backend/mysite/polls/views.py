from django.http import HttpResponse
# Create your views here.
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from .models import CustomUser
import json
from django.views.decorators.csrf import csrf_exempt

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate

def index(request):
    return HttpResponse("hello world")

@csrf_exempt
@require_POST
def register(request):
    data = json.loads(request.body)
    username = data.get('username', '')
    password = data.get('password', '')
    if username and password:
        user = CustomUser.objects.create_user(username=username, password=password)
        return JsonResponse({'message': 'User registered successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

@csrf_exempt
@require_POST
def user_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        if username and password:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                refresh = RefreshToken.for_user(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                return JsonResponse({'message': 'Login successful', 'data': data}, status=200)
                #request.session["username"] = user.username
                #return JsonResponse({'message': 'Login successful', 'sessionid': request.session.session_key}, status=200)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        else:
            return JsonResponse({'error': 'Username and password are required'}, status=400)
