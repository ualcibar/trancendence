from rest_framework import serializers
from matchmaking.models import MatchPreview

class MatchPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchPreview 
        fields = ('name','tags')