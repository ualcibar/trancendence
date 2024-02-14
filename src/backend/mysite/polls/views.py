from django.http import HttpResponse
# Create your views here.
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from .models import CustomUser
import json
from django.views.decorators.csrf import csrf_exempt

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
                return JsonResponse({'message': 'Login successful'}, status=200)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        else:
            return JsonResponse({'error': 'Username and password are required'}, status=400)
