from rest_framework import serializers
from matchmaking.models import MatchPreview
from polls.serializers import CustomUserSerializer

class MatchPreviewSerializer(serializers.ModelSerializer):
    host = CustomUserSerializer()
    class Meta:
        model = MatchPreview 
        fields = ('name','tags', 'max_players', 'players', 'host')