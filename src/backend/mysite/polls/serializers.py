from rest_framework import serializers
from .models import CustomUser, Tournament, Game

class CustomUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('id','username','wins','loses','total')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
    
class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.StringRelatedField(read_only=True)
    player2 = serializers.StringRelatedField(read_only=True)
    winner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Game
        fields = '__all__'

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
        fields = '__all__'