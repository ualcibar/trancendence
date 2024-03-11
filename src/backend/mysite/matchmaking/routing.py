from .consumers import ChatConsumer
from django.urls import re_path

websocket_urlpatterns = [
#    re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
    re_path(r'matchmaking/', ChatConsumer.as_asgi()),
]