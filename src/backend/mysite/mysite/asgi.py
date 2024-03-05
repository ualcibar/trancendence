"""
ASGI config for mysite project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/


import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

application = get_asgi_application()
"""


from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from .polls.auth import CustomAuthentication

import chat.routing
from django.core.asgi import get_asgi_application
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")

#application = ProtocolTypeRouter({
#    "websocket": URLRouter(
#            chat.routing.websocket_urlpatterns
#    ),
#    "http": get_asgi_application(),
#})


application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        CustomAuthentication(
            URLRouter(
                chat.routing.websocket_urlpatternsebsocket_urlpatterns
            )
        )
    ),
})