from rest_framework import serializers
from .models import CustomUser,Statistics

class LightUserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id','username','status')

class UserInfoSerializer(serializers.ModelSerializer):
    avatarUrl = serializers.SerializerMethodField()
    matchHistory = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()
    class Meta:
        model = CustomUser
        fields = ('id','username', 'status','color', 'statistics','avatarUrl', 'matchHistory')
    def get_avatarUrl(self, instance):
        return f'https://localhost:1501/api/media/{instance.avatar}'
    def get_matchHistory(self, instance):
        return [match.id for match in instance.team_a_matches.all()] + [match.id for match in instance.team_b_matches.all()]
    def get_statistics(self, user):
        return StatisticsSerializer(user.statistics).data

class PrivateUserInfoSerializer(serializers.ModelSerializer):
    info = UserInfoSerializer(source='*')
    friends = UserInfoSerializer(many=True, read_only=True)
    class Meta:
        model = CustomUser
        fields = ('info', 'friends', 'language', 'email')
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class StatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistics
        fields = ('wins', 'loses', 'total')