from django.core import serializers
from .models import Avatar, CustomUser, Friend, Tournament, Game

class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.StringRelatedField(read_only=True)
    player2 = serializers.StringRelatedField(read_only=True)
    winner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id',
            'player1',
            'player2',
            'goalsPlayer1',
            'goalsPlayer2',
            'winner',
            'tournamentGame',
            'date',
        ]

class TournamentSerializer(serializers.ModelSerializer):
    quarterfinal1 = GameSerializer(read_only=True)
    quarterfinal2 = GameSerializer(read_only=True)
    quarterfinal3 = GameSerializer(read_only=True)
    quarterfinal4 = GameSerializer(read_only=True)
    semifinal1 = GameSerializer(read_only=True)
    semifinal2 = GameSerializer(read_only=True)
    final = GameSerializer(read_only=True)
    tournamentPlayers = CustomUserSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = [
            'id',
            'title',
            'playerNum',
            'quarterfinal1',
            'quarterfinal2',
            'quarterfinal3',
            'quarterfinal4',
            'semifinal1',
            'semifinal2',
            'final',
            'date',
            'tournamentPlayers',
        ]
    
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser()
        fields = [
            'id',
            'username',
            'wins',
            'loses',
            'total',
            'friends',
            'status',
        ]