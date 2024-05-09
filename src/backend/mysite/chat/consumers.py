import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync
from chat.models import Room
import logging
import time

logger = logging.getLogger('std')

class ChatConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.user = None
        self.auth = JWTAuthentication()
        self.user_inbox = None
        self.room = None
        self.isInit = False

    def connect(self):
        jwt_token = self.scope['query_string'].decode().split('=')[1]
        try:
            token = self.auth.get_validated_token(jwt_token)
            if token is None:
                raise DenyConnection('User is not authenticated.')
            self.user = self.auth.get_user(token)
            if self.user is None:
                raise DenyConnection('User is not authenticated.')
        except:
            raise DenyConnection('User is not authenticated.')

        self.accept()
        
        self.room_group_name = 'global_chat'
        self.user_inbox = f'inbox_{self.user.username}_chat'
        self.room = Room.objects.get_or_create(name=self.room_group_name)
        async_to_sync(self.channel_layer.group_add)( self.user_inbox, self.channel_name)
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'user_join',
                'user': self.user.username,
            }
        )
        self.send(json.dumps({
            'type': 'user_list',
            'users': [user.username for user in self.room[0].online.all()],
        }))

        self.room[0].join(self.user)
        self.isInit = True 

    def disconnect(self, close_code):
        if self.isInit:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.user.username,
                }
            )
            self.room[0].leave(self.user)
            async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
            async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)


    def receive(self, text_data):
        data = json.loads(text_data)
        msg_id = self.id_generator()
        match data['type']:
            case '/pm':
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{data['target']}_chat', 
                    {
                        "type": "private_message",
                        "user": self.user.username,
                        "message": data['message'],
                        "id": msg_id
                    }
                )
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{self.user.username}_chat',  
                    {
                        "type": "private_message_delivered",
                        "target": data['target'],
                        "sender": self.user.username,
                        "message": data['message'],
                        "id": msg_id
                    }
                )
            case '/list':
                self.send(json.dumps({
                    'type': 'user_list',
                    'users': [user.username for user in self.room.online.all()],
                }))
            case '/global':
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "global_message",
                        "user": self.user.username,
                        "message": data['message'],
                        "id": msg_id
                    }
                )

    def global_message(self, event):
        self.send(text_data=json.dumps(event))

    def private_message(self, event):
        self.send(text_data=json.dumps(event))

    def private_message_delivered(self, event):
        self.send(text_data=json.dumps(event))

    def user_join(self, event):
        self.send(text_data=json.dumps(event))

    def user_leave(self, event):
        self.send(text_data=json.dumps(event))

    def id_generator(self):
        return time.clock_gettime_ns(time.CLOCK_REALTIME)

