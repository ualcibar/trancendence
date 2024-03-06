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

        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        #if not self.user.is_authenticated:  # new
        #    return                          # new


        # Broadcast the received message to all clients in the channel
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,  # Channel name (you can use any name)
            {
                "type": "chat_message",
                "user": self.user.username,
                "message": message
            }
        )

    def chat_message(self, event):
        self.send(text_data=json.dumps(event))


#message = event['message']

#        self.send(text_data=json.dumps({
#            'type' : 'chat',
#            'message' : message,
#            'user' : event['user']
#        }))