import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync
from chat.models import Room
from matchmaking.models import MatchPreview

import logging

logger = logging.getLogger('std')

class MatchMakingConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.user = None
        self.auth = JWTAuthentication()
        self.user_inbox = None
        self.match = None
    def connect(self):
        jwt_token = self.scope['query_string'].decode().split('=')[1]
        try:
            token = self.auth.get_validated_token(jwt_token)
            if token is None:
                raise DenyConnection('User is not authenticated.')
            self.user = self.auth.get_user(token)
        except:
            raise DenyConnection('User is not authenticated.')

        self.room_group_name = 'global'
        self.user_inbox = f'inbox_{self.user.username}'
        async_to_sync(self.channel_layer.group_add)( self.user_inbox, self.channel_name)
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)

        self.accept()

        self.send(json.dumps({
            'type': 'match_tournament_list',
            'matches': [match.name for match in MatchPreview.objects.filter(public=True)],
            'tournamets': [],
        }))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
        async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)


    def receive(self, text_data):
        logger.debug('message recieved')
        text_data_json = json.loads(text_data)
        operation = text_data_json['message']
        if operation.startswith('/new_match '):
            logger.debug('new match requested')
            try:
                bundle = json.loads(operation.split(' ', 1)[1])
                logger.debug(f'new match name = {bundle['name']}')
                self.match = MatchPreview.objects.create(
                    name=bundle['name'],
                    tags=bundle['tags'],
                    public=bundle['publicGame'],
                    host=self.user,
                )
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'new_match',
                        'match': {
                            'name': bundle['name'],
                            'tags': bundle['tags'],
                            'host': self.user.username
                        },
                    }
                )
                logger.debug('new match success')
            except Exception as e:
                logger.debug(f'failed to make match {e}')
                return
        elif operation.startswith('/new_tournament'):
            bundle = operation.split(' ', 1)
            try:
                new_tournament_name = json.loads(bundle[1])['name']
            except:
                return
            self.matches.append(new_tournament_name)
            self.send(json.dumps({
                'type': 'new_tournament',
                'new_tournament_name': new_tournament_name,
            }))
        elif operation.startswith('/del_match'):
            bundle = operation.split(' ', 1)
            match_name = bundle[1]
            if match_name in self.matches:
                self.match.remove(match_name)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'del_match',
                        'del_match_name': match_name,
                    }
                )
        elif operation.startswith('/del_tournament'):
            bundle = operation.split(' ', 1)
            tournament_name = bundle[1]
            if tournament_name in self.matches:
                self.match.remove(tournament_name)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'del_tournament',
                        'del_tournament_name': tournament_name,
                    }
                )

    def match_tournament_list(self, event):
        self.send(text_data=json.dumps(event))
    
    def new_tournament(self, event):
        self.send(text_data=json.dumps(event))
    
    def del_match(self, event):
        self.send(text_data=json.dumps(event))

    def user_join(self, event):
        self.send(text_data=json.dumps(event))

    def del_tournament(self, event):
        self.send(text_data=json.dumps(event))

    def new_match(self, event):
        self.send(text_data=json.dumps(event))