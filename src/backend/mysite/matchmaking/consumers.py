import json
from django.utils import timezone
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
from matchmaking.models import MatchPreview, Player, Match
from matchmaking.serializers import MatchPreviewSerializer,MatchPreviewToOnlineMatchInfoSerializer, MatchPreviewToOnlineMatchSettings2Serializer
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
        if self.user.previous_status == CustomUser.IN_GAME:
            if self.user.game == None or self.user.game_room_name == None:
                self.user.game = None
                self.user.game_room_name = None
                self.user.status = CustomUser.CONNECTED
                try:
                    player = Player.objects.get(user=self.user)
                    player.delete()
                except Exception as e:
                    logger.debug('connect: cant find self in player table, {e}')
            else:
                async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                serialized_match = MatchPreviewToOnlineMatchInfoSerializer(self.user.game).data
                self.send(json.dumps({
                    'type': 'match_reconnect',
                    'match' : serialized_match
                }))
                async_to_sync(self.channel_layer.group_send)(
                    f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                    {
                        'type': 'match_player_reconnected',
                        'player_id' : self.user.id,
                        'player' : self.user.username
                    }
                )
                self.user.status = CustomUser.IN_GAME
        else:
            clearUserMatchRelated(self.user)
            self.user.status = CustomUser.CONNECTED
        self.send_match_list_to_self()
        self.isInit = True
        self.user.save()

    def disconnect(self, close_code):
        if self.isInit:
            self.user.refresh_from_db()
            self.user.previous_status = CustomUser.STAND_BY
            if self.user.status == CustomUser.JOINING_GAME:
                try:
                    player = Player.objects.get(user=self.user)
                    player.delete()
                except Exception as e:
                    logger.debug('Disconnect: cant find self in player table, {e}')
                if self.user.game.isHost(self.user):
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_host_left_joining',
                        }
                    )
                    self.deleteMatchPreview(self.user.game)
                else:
                    self.user.game.playerLeft(self.user.id)
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_player_left',
                            'player_id': self.user.id,
                            'player': self.user.username,
                        }
                    )
            elif self.user.status == CustomUser.IN_GAME:
                if self.user.game.isHost(self.user):
                    self.handleHostLeftMatch()
                else:
                    self.user.previous_status = self.user.status
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'match_player_left',
                            'player_id': self.user.id,
                            'player': self.user.username,
                        }
                    )
            self.user.status = CustomUser.DISCONNECTED
            self.user.save()
            async_to_sync(self.channel_layer.group_discard)(self.global_room_name, self.channel_name)
            async_to_sync(self.channel_layer.group_discard)(self.user_inbox, self.channel_name)

    def receive(self, text_data):
        data = json.loads(text_data)
        self.user.refresh_from_db()
        match data['type']:
            case "/getState":
                self.send(json.dumps({
                    'type': 'status',
                    'status' : self.user.status
                }))
            case "/reset":
                self.user.status = CustomUser.CONNECTED
                self.user.save()
            case "/new_match":
                if self.user.status != CustomUser.CONNECTED:
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'failure_already_in_another_game',
                    }))
                    return 
                try:
                    self.user.game = MatchPreview.objects.create(
                        name=data['settings']['name'],
                        publicMatch=data['settings']['publicMatch'],
                        maxTimeRoundSec = data['settings']['matchSettings']['maxTimeRoundSec'],
                        maxRounds = data['settings']['matchSettings']['maxRounds'],
                        roundsToWin = data['settings']['matchSettings']['roundsToWin'],
                        teamSize = int(data['settings']['matchSettings']['teamSize']),
                        mapName = data['settings']['matchSettings']['mapName'],
                        host=self.user,
                        available=True
                    )
                    self.user.game.add_paddles(data['settings']['matchSettings']['initPaddleStates'])
                    serialized_match = MatchPreviewToOnlineMatchInfoSerializer(self.user.game).data
                    async_to_sync(self.channel_layer.group_send)(
                        self.global_room_name,
                        {
                            'type': 'new_match',
                            'match': serialized_match['onlineSettings']
                        }
                    )
                    self.send(json.dumps({
                        'type': 'new_match_result',
                        'status': 'success',
                        'match' : serialized_match
                    }))
                    self.user.game_room_name = f'{data['settings']['name']}_match'
                    self.user.status = CustomUser.JOINING_GAME
                    self.user.save()
                    async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                except IntegrityError as e:
                    if "duplicate key value violates unique constraint" in str(e):
                        # Handle the specific case of duplicate key violation
                        logger.debug("Receive: new match: Duplicate key violation occurred.")
                        self.send(json.dumps({
                            'type': 'new_match_result',
                            'status': 'failure_duplicate_key',
                        }))
                        if self.user.game is not None:
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
                    self.user.game.delete()
            case '/match_list':
                self.send_match_list_to_self()
            case '/join/match':
                if self.user.status != CustomUser.CONNECTED:
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
                    self.user.status = CustomUser.JOINING_GAME
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
                        self.user.status = CustomUser.CONNECTED
                        self.user.save() 
                        return
                    index = result['index']
                    serialized_match = MatchPreviewToOnlineMatchInfoSerializer(self.user.game).data
                    async_to_sync(self.channel_layer.group_add)(self.user.game_room_name, self.channel_name)
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'success',
                        'match' : serialized_match
                    }))
                    async_to_sync(self.channel_layer.group_send)(
                        self.user.game_room_name,
                        {
                            'type': 'player_joined_match',
                            'player': user_info,
                            'index' : index 
                        }
                    )
                    avatarUrl =  f'https://localhost:1501/api/media/{self.user.avatar}'
                    async_to_sync(self.channel_layer.group_send)(
                        f'inbox_{self.user.game.getHostUsername()}_matchmaking',
                        {
                            'type': 'player_joined_match_to_host',
                            'username': self.user.username,
                            'senderId' : self.user.id,
                            'userInfo': user_info,
                            'avatarUrl' : avatarUrl,
                            'index' : self.user.game.getPlayerIndex(self.user)
                        }
                    )
                except Exception as e:
                    self.user.game = None 
                    self.user.game_room_name = None 
                    self.user.status = CustomUser.CONNECTED
                    self.user.save() 
                    self.send(json.dumps({
                        'type': 'join_match_result',
                        'status': 'failure',
                    }))
                    return
            case '/match/cancel_join':
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
                self.user.status = CustomUser.CONNECTED
                self.user.save()
                #send group or host? player left match
                #leave match chat
                pass
            case 'match_player_left':
                if (self.user.id == data.player_id):
                    return
                if (self.user.username == self.game.getHostUsername()):
                   pass 
            case '/match/host_left':
                if self.user == self.user.game.host:
                    self.handleHostLeftMatch()
            case '/match/end':
                match(data['state']):
                    case 'FinishedSuccess':
                        users = self.user.game.getTeamA() + self.user.game.getTeamB()
                        logger.debug(f'teamA{[user.username for user in self.user.game.getTeamA()]}')
                        logger.debug(f'teamB{[user.username for user in self.user.game.getTeamB()]}')
                        score = data['score'] 
                        if score[0] != score[1]:
                            async_to_sync(self.channel_layer.group_send)(
                                self.user.game_room_name,
                                {
                                    'type': 'match_finished',
                                    'status' : 'success',
                                    'result' : 'winner',
                                    'score' : score,
                                }
                            )
                        else:
                            async_to_sync(self.channel_layer.group_send)(
                                self.user.game_room_name,
                                {
                                    'type': 'match_finished',
                                    'status' : 'success',
                                    'result' : 'draw',
                                }
                            )
                        logger.debug(f'creating match from{self.user.game}')
                        Match.from_match_preview(self.user.game, score)
                        for user in users:
                            statistics = user.statistics
                            statistics.total += 1
                            if score[0] != score[1]:
                                if score[0] > score[1]:
                                    if user in user.game.getTeamA():
                                        statistics.wins += 1
                                    else:
                                        statistics.loses += 1
                                else:
                                    if user in user.game.getTeamB():
                                        statistics.wins += 1
                                    else: 
                                        statistics.loses += 1
                            statistics.save()
                            logger.debug(f'statistics updated for user {user.username}')
                            async_to_sync(self.channel_layer.group_discard)(self.global_room_name, self.channel_name)
                            clearUserMatchRelated(user)
                        self.deleteMatchPreview(self.user.game)
                    case _:
                        logger.error(f'unhandled state{data['state']}')

            case '/clear_user':
                async_to_sync(self.channel_layer.group_discard)(self.user.game_room_name, self.channel_name) 
                clearUserMatchRelated(self.user)

            case '/confirm_join/match':
                try:
                    user = CustomUser.objects.get(id=data['playerId']) 
                    user.status = CustomUser.JOINING_GAME
                    user.save()
                    user = CustomUser.objects.get(id=data['playerId']) 
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
                if self.user.game_room_name:
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
                users = self.user.game.getTeamA() + self.user.game.getTeamB()
                for user in users:
                    user.status = CustomUser.IN_GAME
                    user.save()
                async_to_sync(self.channel_layer.group_send)(
                    self.global_room_name,
                    {
                        'type': 'match_unavailable',
                        'match_name' : self.user.game.name
                    }
                )
                self.user.game.available = False
                self.user.game.save()

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
                    user.status = CustomUser.IN_GAME
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
                self.user.status = CustomUser.CONNECTED
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
    def match_host_left_joining(self, event):
        self.send(text_data=json.dumps(event))
    def match_player_reconnected(self, event):
        self.send(text_data=json.dumps(event))
    def match_confirm_reconnect(self, event):
        self.send(text_data=json.dumps(event))
    def match_finished(self, event):
        self.send(text_data=json.dumps(event))
    def del_match(self, event):
        self.send(text_data=json.dumps(event))
    def match_unavailable(self, event):
        self.send(text_data=json.dumps(event))

    def checking(self, event):
        self.send(text_data=json.dumps(event))

    def send_match_list_to_self(self):
        self.send(json.dumps({
            'type': 'match_list',
            'matches': [MatchPreviewToOnlineMatchSettings2Serializer(match).data for match in MatchPreview.objects.filter(publicMatch=True, available=True)],
        }))

    def handleHostLeftMatch(self):
        Match.from_match_preview(self.user.game, [0,self.user.game.roundsToWin])
        async_to_sync(self.channel_layer.group_send)(
            self.user.game_room_name,
            {
                'type': 'match_finished',
                'status' : 'host_left',
                'result' : 'winner',
                'score' : [0,self.user.game.roundsToWin]
            }
        )
        self.deleteMatchPreview(self.user.game)
        async_to_sync(self.channel_layer.group_discard)(self.user.game_room_name, self.channel_name) 
        clearUserMatchRelated(self.user)

    def deleteMatchPreview(self, matchPreview : MatchPreview):
        async_to_sync(self.channel_layer.group_send)(
            self.global_room_name,
            {
                'type': 'del_match',
                'del_match_name' : matchPreview.name,
            }
        ) 
        if matchPreview is not None:
            matchPreview.delete()

def clearUserMatchRelated(user : CustomUser): 
    user.clearGameRelated()
    try:
        from matchmaking.models import Player
        player = Player.objects.get(user=user)
        player.delete()
    except Exception as e:
        logger.debug('clear User match: cant find self in player table, {e}')

def discard_group_channels(group_name):
    channel_layer = get_channel_layer()
    group_channels = async_to_sync(channel_layer.group_channels)(group_name)
    for channel_name in group_channels:
        async_to_sync(channel_layer.group_discard)(group_name, channel_name)
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