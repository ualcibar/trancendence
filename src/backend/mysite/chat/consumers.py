import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer



from asgiref.sync import async_to_sync



class ChatConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_name = None
        self.room_group_name = None
        self.user = None
        
    def connect(self):
        self.room_name = 'global'
        self.room_group_name = 'chat_global'
        self.user = self.scope['user']
        self.accept()

        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)


    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        if not self.user.is_authenticated:  # new
            return                          # new


        # Broadcast the received message to all clients in the channel
        async_to_sync(self.channel_layer.group_send)(
            self.channel_layer.group_send,  # Channel name (you can use any name)
            {
                "type": "chat_message",
                "user": self.user.username,
                "message": message
            }
        )

    def chat_message(self, event):
        self.send(text_data=json.dumps(event))