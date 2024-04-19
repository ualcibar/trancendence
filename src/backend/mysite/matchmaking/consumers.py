import json
from django.db import IntegrityError
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
        self.global_room_name = 'global_matchmaking'
        self.user_inbox = None
        self.user = None
        self.auth = JWTAuthentication()
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
        self.user_inbox = f'inbox_{self.user.username}_matchmaking'
        async_to_sync(self.channel_layer.group_add)(self.user_inbox, self.channel_name)
        async_to_sync(self.channel_layer.group_add)(self.global_room_name, self.channel_name)

        self.accept()

        self.send(json.dumps({
            'type': 'match_tournament_list',
            'matches': [MatchPreviewSerializer(match).data for match in MatchPreview.objects.filter(public=True)],
            'tournamets': [],
        }))
        self.isInit = True
        self.user.status = 'Connected'
        self.user.save()

    def disconnect(self, close_code):
        if self.isInit:
            if self.user.status == 'InGame' or self.user.status == 'Joining Game':
                #tell room group about the lobby falling
                if self.user.game.isHost(self.user):
                    logger.debug('deleting game')
                    self.user.game.delete()
                    self.user.game = None
            logger.debug(f'status: {self.user.status}') 
            self.user.status = 'Disconnected'
            self.user.save()
            async_to_sync(self.channel_layer.group_discard)(self.global_room_name, self.channel_name)
            async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)

    def receive(self, text_data):
        logger.debug('message recieved')
        data = json.loads(text_data)
        logger.debug(data)
        match data['type']:
            case "/getState":
                self.send(json.dumps({
                    'type': 'status',
                    'status' : self.user.status
                }))
            case "/reset":
                self.user.status = 'Connected'
                self.user.save()
            case "/new_match":
                logger.debug('new match requested')
                if self.user.status != 'Connected':
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'failure_already_in_another_game',
                    }))
                    return 
                try:
                    logger.debug(f'new match name = {data['settings']['name']}')
                    self.user.game = MatchPreview.objects.create(
                        name=data['settings']['name'],
                        tags=data['settings']['tags'],
                        public=data['settings']['publicGame'],
                        host=self.user,
                    )
                    async_to_sync(self.channel_layer.group_send)(
                        self.global_room_name,
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
                        'match' : data['settings']
                    }))
                    self.user.game_room_name = data['settings']['name']
                    self.user.status = 'Joining Game'
                    self.user.save()
                    async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                    logger.debug('new match success')
                except IntegrityError as e:
                    if "duplicate key value violates unique constraint" in str(e):
                        # Handle the specific case of duplicate key violation
                        logger.debug("Duplicate key violation occurred.")
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure_duplicate_key',
                        }))
                        self.user.game.delete()
                    else:
                        # Handle other IntegrityError exceptions
                        logger.debug("Another type of IntegrityError occurred:", e)
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure',
                        }))
                        self.user.game.delete()
                except Exception as e:
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'failure',
                    }))
                    logger.debug(f'Error creating match, {e}')
                    self.user.game.delete()
            case '/new_tournament':
                self.matches.append(data['name'])
                self.send(json.dumps({
                    'type': 'new_tournament',
                    'new_tournament_name': data['name'],
                }))
            case '/match_tournament_list':
                self.send(json.dumps({
                    'type': 'match_tournament_list',
                    'matches': [MatchPreviewSerializer(match).data for match in MatchPreview.objects.filter(public=True)],
                    'tournamets': [],
                }))
            case '/join/match':
                if self.user.status != 'Connected':
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'failure_already_in_another_game',
                    }))
                    return
                try:
                    match_game = MatchPreview.objects.get(
                        name=data['name'],
                    )
                    self.user.game = match_game
                    self.user.game_room_name = match_game.name
                    self.user.status = 'joiningGame'
                    self.user.save() 
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'player_joined_match',
                            'username': self.user.username,
                        }
                    )
                    async_to_sync(self.channel_layer.group_send)(
                        f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                        {
                            'type': 'player_joined_match_to_host',
                            'username': self.user.username,
                            'sdp' : data['sdp']
                        }
                    )
                    #self.send(json.dumps({
                    #    'type': 'join_match_result',
                    #    'status': 'succes',
                    #    'players' : [player.username for player in match_game.players]
                    #}))
                    logger.debug('new match success')
                except Exception as e:
                    self.user.game = None 
                    self.user.game_room_name = None 
                    self.user.status = 'Connected'
                    self.user.save() 
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'failure',
                    }))
                    logger.debug(f'failed to join match {e}')
                    return
            case '/join/tournament':
                pass
            case '/webrtc/answer':
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{data['target']}_matchmaking',
                    {
                        'type': 'webrtc_answer',
                        'answer': data['answer'],
                    }
                ) 
            case '/webrtc/candidate':
                async_to_sync(self.channel_layer.group_send)(
                    f'{self.user.game_room_name}',
                    {
                        'type': 'webrtc_candidate',
                        'candidate': data['candidate'],
                        'sender': self.user.username
                    }
                ) 
            case '/leave/game':
                self.user.status = 'Connected'
                self.user.save()
                async_to_sync(self.channel_layer.group_discard)(self.game_room_name, self.channel_name)
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
    
    def leave_match(self, event):
        self.send(text_data=json.dumps(event))
   
    def leave_tournament(self, event):
        self.send(text_data=json.dumps(event))

    def user_join(self, event):
        self.send(text_data=json.dumps(event))
    def webrtc_answer(self, event):
        self.send(text_data=json.dumps(event))
    def webrtc_candidate(self, event):
        self.send(text_data=json.dumps(event))
    def player_joined_match(self, event):
        self.send(text_data=json.dumps(event))
    def player_joined_match_to_host(self, event):
        self.send(text_data=json.dumps(event))
        
#
#
#case '/del_match':
#    if isinstance(self.hostedGame, MatchPreview):
#        async_to_sync(self.channel_layer.group_send)(
#                self.global_room_name,
#            {
#                    'type': 'del_match',
#                'del_match_name': data['name'],
#            }
#        )
#        async_to_sync(self.channel_layer.group_send)(
#                self.game_room_name,
#            {
#                    'type': 'match_terminated_by_host',
#                'del_match_name': data['name'],
#            }
#        )
#        async_to_sync(self.channel_layer.group_discard)(self.game_room_name, self.channel_name)
#        try:
#            self.hostedGame.delete()
#        except:
#            pass
#    else:
#        self.send(json.dumps({
#                'type': 'del_match_result',
#            'status': 'failure',
#        }))
#case '/del_tournament':
#    if data['name'] in self.matches:
#        self.match.remove(data['name'])
#        async_to_sync(self.channel_layer.group_send)(
#                self.global_room_name,
#            {
#                    'type': 'del_tournament',
#                'del_tournament_name': data['name'],
#            }
#        )
#