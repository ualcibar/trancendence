from rest_framework import serializers
from matchmaking.models import MatchPreview, Player, Match
from polls.serializers import UserInfoSerializer

class MatchPreviewSerializer(serializers.ModelSerializer):
    host = UserInfoSerializer()
    players = serializers.SerializerMethodField()
    class Meta:
        model = MatchPreview 
        fields = ('name','tags', 'teamSize', 'players', 'host', 'mapName')

    def get_players(self, instance):
        # Assuming 'players' is a ManyToManyField related to User model
        players_queryset = instance.players.all()  # Get all players related to the match
        players = [None for _ in range(instance.teamSize * 2 - 1)]
        for player in players_queryset:
            players[player.index] = PlayerSerializer(player).data
        return players
    

class PlayerSerializer(serializers.ModelSerializer): 
    username = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    class Meta:
        model = Player
        fields = ('username', 'id', 'state')
   
    def get_username(self, obj):
        return obj.user.username

    def get_id(self, obj):
        return obj.user.id
    

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