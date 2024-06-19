from rest_framework import serializers
from matchmaking.models import MatchPreview, Player, Match
from polls.serializers import UserInfoSerializer
import logging
logger = logging.getLogger('std')
class MatchPreviewSerializer(serializers.ModelSerializer):
    host = UserInfoSerializer()
    players = serializers.SerializerMethodField()
    class Meta:
        model = MatchPreview 
        fields = ('name','teamSize', 'players', 'host', 'mapName')

    def get_players(self, instance):
        # Assuming 'players' is a ManyToManyField related to User model
        players_queryset = instance.players.all()  # Get all players related to the match
        players = [None for _ in range(instance.teamSize * 2 - 1)]
        for player in players_queryset:
            players[player.index] = PlayerSerializer(player).data
        return players

class MatchPreviewToMatchSettingsSerializer(serializers.ModelSerializer):
    initPaddleStates = serializers.SerializerMethodField()
    class Meta:
        model = MatchPreview 
        fields = ('maxTimeRoundSec', 'maxRounds', 'roundsToWin', 'teamSize', 'mapName', 'initPaddleStates') 
    def get_initPaddleStates(self, match : MatchPreview):
        return match.getPaddles()

class MatchPreviewToOnlineMatchSettings2Serializer(serializers.ModelSerializer):
    matchSettings = MatchPreviewToMatchSettingsSerializer(source='*')
    class Meta:
        model = MatchPreview 
        fields = ('name', 'publicMatch', 'matchSettings', 'available')

class MatchPreviewToOnlineMatchInfoSerializer(serializers.ModelSerializer):
    onlineSettings = MatchPreviewToOnlineMatchSettings2Serializer(source='*')
    host = UserInfoSerializer()
    players = serializers.SerializerMethodField()
    class Meta:
        model = MatchPreview
        fields = ('host', 'players', 'onlineSettings')
    
    def get_players(self, instance : MatchPreview):
        # Assuming 'players' is a ManyToManyField related to User model
        players_queryset = instance.players.all()  # Get all players related to the match
        logger.debug(f'teamSize {instance.teamSize} type {type(instance.teamSize)}') 
        players = [None for _ in range(instance.teamSize * 2 - 1)]
        for player in players_queryset:
            players[player.index] = PlayerSerializer(player).data
        return players

class PlayerSerializer(serializers.ModelSerializer): 
    username = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()
    class Meta:
        model = Player
        fields = ('username', 'id', 'state', 'avatarUrl')
   
    def get_username(self, obj):
        return obj.user.username

    def get_id(self, obj):
        return obj.user.id
    
    def get_avatarUrl(self, player : Player):
        return f'https://localhost:1501/api/media/{player.user.avatar}'
        

class MatchSerializer(serializers.ModelSerializer): 
    teamA = serializers.SerializerMethodField()
    teamB = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ('date', 'score_a', 'score_b', 'teamA', 'teamB', 'teamSize')
   
    def get_teamA(self, match):
        return UserInfoSerializer(match.team_a.all(), many=True).data

    def get_teamB(self, match):
        return UserInfoSerializer(match.team_b.all(), many=True).data