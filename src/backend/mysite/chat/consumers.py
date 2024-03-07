import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync

class ChatConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.user = None
        self.auth = JWTAuthentication()
        self.user_inbox = None 

    def connect(self):
        jwt_token = self.scope['query_string'].decode().split('=')[1]
        token = self.auth.get_validated_token(jwt_token)
        if token is None:
            raise DenyConnection('User is not authenticated.')
        try:
            self.user = self.auth.get_user(token)
        except:
            raise DenyConnection('User is not authenticated.')

        self.room_group_name = 'global'
        self.user_inbox = f'inbox_{self.user.username}'
        async_to_sync(self.channel_layer.group_add)( self.user_inbox, self.channel_name)
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
        async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        if message.startswith('/pm '):
            bundle = message.split(' ', 2)
            target_user = bundle[1]
            private_message = bundle[2]

            async_to_sync(self.channel_layer.group_send)(
                f'inbox_{target_user}',  
                {
                    "type": "private_message",
                    "user": self.user.username,
                    "message": private_message
                }
            )
            async_to_sync(self.channel_layer.group_send)(
                f'inbox_{self.user}',  
                {
                    "type": "private_message_delivered",
                    "user": self.user.username,
                    "message": private_message
                }
            )
        else:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "user": self.user.username,
                    "message": message
                }
            )

    def chat_message(self, event):
        self.send(text_data=json.dumps(event))

    def private_message(self, event):
        self.send(text_data=json.dumps(event))

    def private_message_delivered(self, event):
        self.send(text_data=json.dumps(event))