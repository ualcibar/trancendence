from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions

import logging

logger = logging.getLogger('polls')


class CustomAuthentication(JWTAuthentication):
    def authenticate(self, request):
        logger.debug('authenticate called')
        header = self.get_header(request)
        if header is None:
            logger.debug('checking for cookies')
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
        else:
            raw_token = self.get_raw_token(header)
        if raw_token is None:
            logger.debug('get the fuck out')
            return None
        logger.debug('you fucking suck')
        validated_token = self.get_validated_token(raw_token)
        logger.debug('authentificated')
        return self.get_user(validated_token), validated_token
