# Create your views here.
from django.http import HttpResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from rest_framework.decorators import api_view

from .models import CustomUser

import json

def index(request):
    return HttpResponse("hello world")

@login_required
@csrf_exempt
@api_view(['GET'])
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

@csrf_exempt
@api_view(['POST'])
def user_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        if username and password:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
<<<<<<< HEAD
                return JsonResponse({'message': 'Login successful'}, status=200)
=======
                refresh = RefreshToken.for_user(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                return JsonResponse({'message': 'Login successful', 'data': data}, status=200)
                #request.session["username"] = user.username
                #return JsonResponse({'message': 'Login successful', 'sessionid': request.session.session_key}, status=200)
>>>>>>> b77350c40d324285a14dd9bef58d3f560847596e
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        else:
            return JsonResponse({'error': 'Username and password are required'}, status=400)
