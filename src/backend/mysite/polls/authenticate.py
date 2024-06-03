from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions
from channels.generic.websocket import WebsocketConsumer

import logging

logger = logging.getLogger('std')


class CustomAuthentication(JWTAuthentication):
    def authenticate(self, request):
        logger.debug('custom authentication class is being used')
        if request is None:
            return None
        #logger.debug('custom authentication class request exists')
        header = self.get_header(request)
        if header is None:
            #logger.debug('custom authentication class  header doesn\'t exists')
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
            #logger.debug(f'custom authentication class token doesn\'t exist after value: {raw_token}')
        else:
            #logger.debug('custom authentication class header exists')
            raw_token = self.get_raw_token(header)
        if raw_token is None:
            #logger.debug('custom authentication class token doesn\'t exist')
            return None
        #logger.debug('custom authentication class token exist')
        validated_token = self.get_validated_token(raw_token)
        #logger.debug('success')
        return self.get_user(validated_token), validated_token

from channels.middleware import BaseMiddleware
from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)
        self.jwt_authentication = CustomAuthentication()

    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        try:
            # Extract and validate JWT token from headers
            user = self.jwt_authentication.authenticate(request=None)
            if user is not None:
                scope['user'] = user
            return await super().__call__(scope, receive, send)
        except InvalidToken:
            # Handle invalid token error
            # For example, return a WebSocket close event with an error code
            await send({
                "type": "websocket.close",
                "code": 1008,  # Policy Violation
                "reason": "Invalid token"
            })

