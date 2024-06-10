from rest_framework import serializers
from .models import CustomUser
class LightUserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id','username','status')

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id','username', 'status','color', 'wins', 'loses')

class PrivateUserInfoSerializer(serializers.ModelSerializer):
    info = UserInfoSerializer(source='*')
    friends = UserInfoSerializer(many=True, read_only=True)
    class Meta:
        model = CustomUser
        fields = ('info', 'friends', 'language', 'email')
