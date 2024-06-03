import json
from django.db import IntegrityError
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import TokenError, AccessToken
from channels.exceptions import DenyConnection

from polls.models import CustomUser
from polls.serializers import UserInfoSerializer

from rest_framework_simplejwt.authentication import JWTAuthentication

from asgiref.sync import async_to_sync
from chat.models import Room
from matchmaking.models import MatchPreview, Player
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
        if self.user.previous_status == 'in_game':
            if self.user.game == None or self.user.game_room_name == None:
                self.user.game = None
                self.user.game_room_name = None
                logger.debug(f'game {self.user.game} room {self.user.game_room_name}, match was deleted')
                self.user.status = 'connected'
                try:
                    player = Player.objects.get(user=self.user)
                    player.delete()
                except Exception as e:
                    logger.debug('connect: cant find self in player table, {e}')
            else:
                async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                serialized_match = MatchPreviewSerializer(self.user.game).data
                self.send(json.dumps({
                    'type': 'match_reconnect',
                    'match' : serialized_match
                }))
                logger.debug(f'sending to {self.user.game.getHostUsername()} player reconnected')
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                    {
                        'type': 'match_player_reconnected',
                        'player_id' : self.user.id,
                        'player' : self.user.username
                    }
                )
                self.user.status = 'in_game'
        else:
            self.user.status = 'connected'
        self.send_match_list_to_self()
        self.isInit = True
        self.user.save()

    def disconnect(self, close_code):
        if self.isInit:
            self.user.refresh_from_db()
            logger.debug(f'player disconnected {self.user.username} status {self.user.status}')
            self.user.previous_status = 'standby'
            if self.user.status == 'joining_game':
                #tell room group about the lobby falling
                try:
                    player = Player.objects.get(user=self.user)
                    player.delete()
                except Exception as e:
                    logger.debug('Disconnect: cant find self in player table, {e}')
                if self.user.game.isHost(self.user):
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_host_left',
                        }
                    )
                    logger.debug('Disconnect: deleting game')
                    self.user.game.delete()
                    self.user.game = None
                else:
                    logger.debug('Disconnect: player disconnected while in or joing match')
                    self.user.game.playerLeft(self.user.id)
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_player_left',
                            'player_id': self.user.id,
                            'player': self.user.username,
                        }
                    )
            elif self.user.status == 'in_game':
                self.user.previous_status = self.user.status
                async_to_sync(self.channel_layer.group_send)(
                    self.user.game_room_name,
                    {
                        'type': 'match_player_left',
                        'player_id': self.user.id,
                        'player': self.user.username,
                    }
                )
            logger.debug(f'Disconnect: status: {self.user.status}, previous: {self.user.previous_status}')
            self.user.status = 'Disconnected'
            self.user.save()
            async_to_sync(self.channel_layer.group_discard)(self.global_room_name, self.channel_name)
            async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)

    def receive(self, text_data):
        data = json.loads(text_data)
        logger.debug(f"receive {data['type']}")
        self.user.refresh_from_db()
        match data['type']:
            case "/getState":
                self.send(json.dumps({
                    'type': 'status',
                    'status' : self.user.status
                }))
            case "/reset":
                self.user.status = 'connected'
                self.user.save()
            case "/new_match":
                logger.debug('Receive: new match: new match requested')
                if self.user.status != 'connected':
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'failure_already_in_another_game',
                    }))
                    return 
                try:
                    logger.debug(f'Receive: new match: new match name = {data['settings']['name']}')
                    self.user.game = MatchPreview.objects.create(
                        name=data['settings']['name'],
                        tags=data['settings']['tags'],
                        public=data['settings']['publicMatch'],
                        maxTimeRoundSec = data['settings']['matchSettings']['maxTimeRoundSec'],
                        maxRounds = data['settings']['matchSettings']['maxRounds'],
                        roundsToWin = data['settings']['matchSettings']['roundsToWin'],
                        teamSize = data['settings']['matchSettings']['teamSize'],
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
                    self.user.game_room_name = f'{data['settings']['name']}_match'
                    self.user.status = 'joining_game'
                    self.user.save()
                    async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                    logger.debug('Receive: new match: new match success')
                except IntegrityError as e:
                    if "duplicate key value violates unique constraint" in str(e):
                        # Handle the specific case of duplicate key violation
                        logger.debug("Receive: new match: Duplicate key violation occurred.")
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure_duplicate_key',
                        }))
                        self.user.game.delete()
                    else:
                        # Handle other IntegrityError exceptions
                        logger.debug("Receive: new match: Another type of IntegrityError occurred:", e)
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
                    logger.debug(f'Receive: new match: Error creating match, {e}')
                    self.user.game.delete()
            case '/match_list':
                self.send_match_list_to_self()
            case '/join/match':
                if self.user.status != 'connected':
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
                    self.user.game_room_name = f'{match_game.name}_match'
                    self.user.status = 'joining_game'
                    self.user.save()
                    user_info =  UserInfoSerializer(self.user).data
                    result = self.user.game.add_player(self.user)
                    if (result['res'] == False):
                        self.send(json.dumps({
                            'type': 'join_match_result',
                            'status': 'failure',
                        }))
                        self.user.game = None 
                        self.user.game_room_name = None 
                        self.user.status = 'connected'
                        self.user.save() 
                        return
                    index = result['index']
                    serialized_match = MatchPreviewSerializer(self.user.game).data
                    async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'success',
                        'match' : serialized_match
                    }))
                    logger.debug('Receive: join match: succes joining')
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'player_joined_match',
                            'userInfo': user_info,
                            'index' : index 
                        }
                    )
                    logger.debug('Receive: join match: succes sendign joined match')
                    async_to_sync(self.channel_layer.group_send)(
                        f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                        {
                            'type': 'player_joined_match_to_host',
                            'username': self.user.username,
                            'senderId' : self.user.id,
                            'userInfo': user_info,
                            'index' : self.user.game.getPlayerIndex(self.user)
                        }
                    )
                    logger.debug('Receive: join match: join match success')
                except Exception as e:
                    self.user.game = None 
                    self.user.game_room_name = None 
                    self.user.status = 'connected'
                    self.user.save() 
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'failure',
                    }))
                    logger.debug(f'Receive: join match: failed to join match {e}')
                    return
            case '/match/cancel_join':
                logger.debug(f'Receive: match cancel join: room name == {self.user.game_room_name}')
                room_name = self.user.game_room_name
                async_to_sync(self.channel_layer.group_send)(
                    room_name,
                    {
                        'type': 'match_player_left',
                        'player_id': self.user.id,
                        'player': self.user.username,
                    }
                )
                async_to_sync(self.channel_layer.group_discard)(self.global_room_name, self.channel_name)
                if (self.user.game.playerLeft(self.user.id) == False):
                    logger.debug('Receive: match cancel join: failed to remove player')
                    
                self.user.game_room_name = None
                self.user.status = 'connected'
                self.user.save()
                #send group or host? player left match
                #leave match chat
                pass
            case 'match_player_left':
                logger.debug(f'Receive: match player left: RECEIVED THE FUCKING MESSAGE DIRECTLY {self.user.username}')
                if (self.user.id == data.player_id):
                    return
                if (self.user.username == self.game.getHostUsername()):
                   pass 
            case '/match/host_left':
                pass
                #self.user.game = None
                #self.user.game_room_name = None
                #self.use.status = Connected
                #self.user.save()
                #leave match chat
                #do not save match in history
                #send client to leave match
            case '/confirm_join/match':
                try:
                    user = CustomUser.objects.get(id=data['playerId']) 
                    user.status = 'in_game'
                    user.save()
                    user = CustomUser.objects.get(id=data['playerId']) 
                    logger.debug(f'changed state {user, user.status}')
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'confirm_join_match_result',
                            'status' : 'success',
                            'playerId' : data['playerId'],
                            'player' :  data['player']
                        }
                    )
                except Exception as e:
                    logger.error(f'confirm join match: {e}')
            case '/webrtc/offer':
                async_to_sync(self.channel_layer.group_send)( 
                    f'inbox_{data['target']}_matchmaking',
                    {
                        'type' : 'webrtc_offer',
                        'offer' : data['offer']
                    }
                )
            case '/webrtc/answer':
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                    {
                        'type': 'webrtc_answer',
                        'answer': data['answer'],
                        'targetId' : self.user.id,
                    }
                ) 
            case '/webrtc/candidate':
                async_to_sync(self.channel_layer.group_send)(
                    self.user.game_room_name,
                    {
                        'type': 'webrtc_candidate',
                        'candidate': data['candidate'],
                        'sender': self.user.username,
                        'senderId' :self.user.id
                    }
                )
            case '/match/all_players_connected':
                async_to_sync(self.channel_layer.group_send)(
                    self.user.game_room_name,
                    {
                        'type': 'match_all_players_connected',
                    }
                )

            case '/match/all_players_connected':
                async_to_sync(self.channel_layer.group_send)(
                    self.user.game_room_name,
                    {
                        'type': 'match_all_players_connected',
                    }
                )
            case '/match/cancel_reconnect':
                #send player cancel
                #change their user information
                pass
            case '/match/cancel_reconnect_to_self':
                #send player cancel
                #change their user information
                pass
            case '/match/confirm_reconnect':
                try:
                    user = CustomUser.objects.get(id=data['playerId'])
                    user.state = 'in_game'
                    user.save()
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_confirm_reconnect',
                            'playerId' : data['playerId']
                        }
                    )
                except Exception as e:
                    logger.error('match confirm reconnect: SHOULD NEVER HAPPEN{e}')

            case '/leave/game':
                self.user.status = 'connected'
                self.user.save()
                async_to_sync(self.channel_layer.group_discard)(self.game_room_name, self.channel_name)
            case _ :
                logger.debug(f'Receive: unexpected type {data['type']}')

    def match_list(self, event):
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
    def webrtc_offer(self, event):
        self.send(text_data=json.dumps(event))
    def webrtc_candidate(self, event):
        self.send(text_data=json.dumps(event))
    def player_joined_match(self, event):
        self.send(text_data=json.dumps(event))
    def player_joined_match_to_host(self, event):
        self.send(text_data=json.dumps(event))
    def confirm_join_match_result(self, event):
        self.send(text_data=json.dumps(event))
    def match_all_players_connected(self, event):
        self.send(text_data=json.dumps(event))

    def match_player_left(self, event):
        self.send(text_data=json.dumps(event))
    def match_host_left(self, event):
        self.send(text_data=json.dumps(event))
    def match_player_reconnected(self, event):
        self.send(text_data=json.dumps(event))
    def match_confirm_reconnect(self, event):
        self.send(text_data=json.dumps(event))

    def send_match_list_to_self(self):
        self.send(json.dumps({
            'type': 'match_list',
            'matches': [MatchPreviewSerializer(match).data for match in MatchPreview.objects.filter(public=True)],
        }))
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