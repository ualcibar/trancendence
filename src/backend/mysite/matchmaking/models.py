from django.db import models, IntegrityError, transaction
from polls.models import CustomUser
import logging

logger = logging.getLogger('std')
class Player(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, unique=True)
    index = models.PositiveIntegerField(default=0, null=False)

class MatchPreview(models.Model):
    #online settings
    name = models.CharField(max_length=128, null=False, unique=True)
    tags = models.CharField(max_length=128, null=False)
    public = models.BooleanField(default=False, null=False)
    #match settings
    maxTimeRoundSec = models.IntegerField(default=60, null=False)
    maxRounds = models.IntegerField(default=3,null=False)
    roundsToWin = models.IntegerField(default=3, null=False)
    teamSize = models.IntegerField(default=1, null=False)
    host = models.ForeignKey(CustomUser, related_name='host', on_delete=models.CASCADE)
    players = models.ManyToManyField(to=Player, related_name='players', blank=True)
    mapName = models.CharField(max_length=32, null=False, default='Default')

    def add_player(self,user):
        try:
            if self.players.count() < self.teamSize * 2:
                index = self.getNextIndex()
                player = Player.objects.create(user=user, index=index)
                self.players.add(player)
                return {'res' : True, 'index' : index}
            else:
                return {'res' : False}
        except Exception as e:
            logger.debug(f'add player threw exception {e}')
            return {'res' : False}

    def playerLeft(self, userId):
        try:
            user = CustomUser.objects.get(id=userId)
            player = Player.objects.get(user=user) 
            logger.debug(f"Player left: Player found:{player}")
            self.players.remove(player)
            logger.debug("Player left: Player removed from game")
            player.delete()
            logger.debug("Player left: Player deleted from database")
            return True
        except Player.DoesNotExist:
            logger.debug("Player left: Player not found.")
            return False
        except Exception as e:
            logger.debug(f"Player left: An error occurred: {e}")
            return False

    def getNextIndex(self):
        existing_indexes = set(self.players.values_list('index', flat=True))
        currentIndex = 0
        while currentIndex in existing_indexes:
            currentIndex += 1
        return currentIndex

    def getPlayerIndex(self, user):
        return self.players.get(user=user).index


    def isHost(self, host):
        return  self.host == host

    def getHostUsername(self):
        return self.host.username

    def __str__(self):
        return f'match name={self.name} host={self.host}'

