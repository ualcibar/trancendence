from .consumers import MatchMakingConsumer
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/matchmaking/(?P<room_name>\w+)/$', MatchMakingConsumer.as_asgi()),
#    re_path(r'ws/matchmaking/', MatchMakingConsumer.as_asgi()),
]