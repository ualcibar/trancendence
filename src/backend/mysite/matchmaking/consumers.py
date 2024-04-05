import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync
from chat.models import Room
from matchmaking.models import MatchPreview
from matchmaking.serializers import MatchPreviewSerializer
import logging

logger = logging.getLogger('std')


class MatchMakingConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.user = None
        self.auth = JWTAuthentication()
        self.user_inbox = None
        self.matchHost = None
        self.isInit = False
    def connect(self):
        jwt_token = self.scope['query_string'].decode().split('=')[1]
        try:
            token = self.auth.get_validated_token(jwt_token)
            if token is None:
                raise DenyConnection('User is not authenticated.')
            self.user = self.auth.get_user(token)
        except:
            raise DenyConnection('User is not authenticated.')

        self.room_group_name = 'global_matchmaking'
        self.user_inbox = f'inbox_{self.user.username}'
        async_to_sync(self.channel_layer.group_add)( self.user_inbox, self.channel_name)
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)

        self.accept()

        self.send(json.dumps({
            'type': 'match_tournament_list',
            'matches': [MatchPreviewSerializer(match).data for match in MatchPreview.objects.filter(public=True)],
            'tournamets': [],
        }))
        self.isInit = True

    def disconnect(self, close_code):
        if self.isInit:
            async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
            async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)

    def receive(self, text_data):
        logger.debug('message recieved')
        data = json.loads(text_data)
        logger.debug(data)
        match data['type']:
            case "/new_match":
                logger.debug('new match requested')
                try:
                    logger.debug(f'new match name = {data['settings']['name']}')
                    self.match = MatchPreview.objects.create(
                        name=data['settings']['name'],
                        tags=data['settings']['tags'],
                        public=data['settings']['publicGame'],
                        host=self.user,
                    )
                    async_to_sync(self.channel_layer.group_send)(
                        self.room_group_name,
                        {
                            'type': 'new_match',
                            'match': {
                                'name': data['settings']['name'],
                                'tags': data['settings']['tags'],
                                'host': self.user.username
                            },
                        }
                    )
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'success',
                    }))
                    logger.debug('new match success')
                except IntegrityError as e:
                    if "duplicate key value violates unique constraint" in str(e):
                        # Handle the specific case of duplicate key violation
                        logger.debug("Duplicate key violation occurred.")
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure_duplicate_key',
                        }))
                    else:
                        # Handle other IntegrityError exceptions
                        logger.debug("Another type of IntegrityError occurred:", e)
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure',
                        }))
                except Exception as e:
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'failure',
                    }))
                    logger.debug(f'Error creating match, {e}')
            case '/new_tournament':
                self.matches.append(data['name'])
                self.send(json.dumps({
                    'type': 'new_tournament',
                    'new_tournament_name': data['name'],
                }))
            case '/del_match':
                if match_name in self.matches:
                    self.match.remove(data['name'])
                    async_to_sync(self.channel_layer.group_send)(
                        self.room_group_name,
                        {
                            'type': 'del_match',
                            'del_match_name': data['name'],
                        }
                    )
            case '/del_tournament':
                if data['name'] in self.matches:
                    self.match.remove(data['name'])
                    async_to_sync(self.channel_layer.group_send)(
                        self.room_group_name,
                        {
                            'type': 'del_tournament',
                            'del_tournament_name': data['name'],
                        }
                    )
            case '/match_tournament_list':
                self.send(json.dumps({
                    'type': 'match_tournament_list',
                    'matches': [MatchPreviewSerializer(match).data for match in MatchPreview.objects.filter(public=True)],
                    'tournamets': [],
                }))
            case '/join/match':
                try:
                    self.match = MatchPreview.objects.filter(
                        name=data['name'],
                    )
                    async_to_sync(self.channel_layer.group_send)(
                        self.room_group_name,
                        {
                            'type': 'new_match',
                            'match': {
                                'name': data['name'],
                                'tags': data['tags'],
                                'host': self.user.username
                            },
                        }
                    )
                    logger.debug('new match success')
                except Exception as e:
                    logger.debug(f'failed to make match {e}')
                    return
            case '/join/tournament':
                pass
            case '/webrtc/offer':
                pass
            case '/webrtc/answer':
                pass
            case _ :
                logger.debug(f'unexpected type {data['type']}')

    def match_tournament_list(self, event):
        self.send(text_data=json.dumps(event))
    
    def new_tournament(self, event):
        self.send(text_data=json.dumps(event))
    
    def new_tournament_result(self, event):
        self.send(text_data=json.dumps(event))
 
    def new_match(self, event):
        self.send(text_data=json.dumps(event))
   
    def new_match_result(self, event):
        self.send(text_data=json.dumps(event))
    
    def del_match(self, event):
        self.send(text_data=json.dumps(event))

    def user_join(self, event):
        self.send(text_data=json.dumps(event))

    def del_tournament(self, event):
        self.send(text_data=json.dumps(event))

'''

'''