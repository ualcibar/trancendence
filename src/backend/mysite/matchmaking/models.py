from django.db import models, IntegrityError, transaction
from polls.models import CustomUser

class MatchPreview(models.Model):
    teamSize = models.IntegerField(default=1)
    name = models.CharField(max_length=128, null=False, unique=True)
    tags = models.CharField(max_length=128, null=False)
    public = models.BooleanField(default=False, null=False)
    host = models.ForeignKey(CustomUser, related_name='host', on_delete=models.CASCADE)
    players = models.ManyToManyField(to=CustomUser, related_name='players', blank=True)
    mapName = models.CharField(max_length=32, null=False, default='Default')

    def add_player(self,name, user):
        try:
            with transaction.atomic():
                match = self.objects.select_for_update().get(name=name)
                if match.players.count() < self.teamSize * 2:
                    match.players.add(user)
                    return True
                else:
                    return False
        except Exception as e:
            return False

    def isHost(self, host):
        return  self.host == host

    def getHostUsername(self):
        return self.host.username

    def __str__(self):
        return f'match name={self.name} host={self.host}'
