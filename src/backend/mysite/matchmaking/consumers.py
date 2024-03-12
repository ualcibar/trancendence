import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync
from chat.models import Room

class MatchMakingConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.user = None
        self.auth = JWTAuthentication()
        self.user_inbox = None
        matches = []

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
            'matches': [user.username for user in self.room[0].online.all()],
            'tournamets': [user.username for user in self.room[0].online.all()],
        }))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
        async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)


    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        operation = text_data_json['operation']

        if operation.startswith('/new_match '):
            bundle = operation.split(' ', 1)
            new_match_name = bundle[1]
            self.matches.push(new_match_name)
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'new_match',
                    'new_match_name': new_match_name,
                }
            )
        elif operation.startswith('/new_tournament'):
            bundle = operation.split(' ', 1)
            new_tournament_name = bundle[1]
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
