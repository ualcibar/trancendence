from rest_framework import serializers
from matchmaking.models import MatchPreview, Player
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
    info = UserInfoSerializer(source='user')
    class Meta:
        model = Player
        fields = ('info', 'state')