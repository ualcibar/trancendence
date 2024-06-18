from django.db import models, IntegrityError, transaction
from polls.models import CustomUser
import logging
from django.utils import timezone

logger = logging.getLogger('std')
class Player(models.Model):
    ONLINE_STATE_CHOICES = (
        ('Joining', 'Joining'),
        ('Connecting', 'Connecting'),
        ('Connected', 'Connected'),
        ('Disconnected', 'Disconnected'),
        ('Blocked', 'Blocked'))
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, unique=True)
    state = models.CharField(
            max_length=20,
            choices=ONLINE_STATE_CHOICES,
            default='Disconnected',
            )
    index = models.PositiveIntegerField(default=0, null=False)

class Paddle(models.Model):
    binded = models.IntegerField(default="0",blank=False, null=False)
    index = models.PositiveIntegerField(default=0, null=False)

class MatchPreview(models.Model):
    #online settings
    name = models.CharField(max_length=128, null=False, unique=True)
    publicMatch = models.BooleanField(default=False, null=False)
    #match settings
    maxTimeRoundSec = models.IntegerField(default=60, null=False)
    maxRounds = models.IntegerField(default=3,null=False)
    roundsToWin = models.IntegerField(default=3, null=False)
    teamSize = models.IntegerField(default=1, null=False)
    host = models.ForeignKey(CustomUser, related_name='host', on_delete=models.CASCADE)
    players = models.ManyToManyField(to=Player, related_name='players', blank=True)
    mapName = models.CharField(max_length=32, null=False, default='Default')
    paddlesInitState = models.ManyToManyField(to=Paddle, related_name='paddlesInitState', blank=True)
    available = models.BooleanField(default=False, blank=False, null=False) 

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

    def add_paddles(self, paddles : list [str]):
        try:
            for i, paddle in enumerate(paddles):
                paddleModel = Paddle.objects.create(index=i, binded=paddle)
                self.paddlesInitState.add(paddleModel)
        except Exception as e:
            logger.debug(f'add paddle threw exception {e}')

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

    def getPaddles(self)-> list [str]:
        return [paddle.binded for paddle in self.paddlesInitState.all()]
    def getTeamA(self):
        return [player.user for player in self.players.all() if player.index + 1 < self.teamSize] + [self.host]
    def getTeamB(self):
        return [player.user for player in self.players.all() if player.index + 1 >= self.teamSize]
    def isHost(self, host):
        return  self.host == host

    def getHostUsername(self):
        return self.host.username

    def __str__(self):
        return f'match name={self.name} host={self.host}'

class Match(models.Model):
    #online settings
    score_a = models.IntegerField(default=0, null=False, blank=False)
    score_b = models.IntegerField(default=0, null=False, blank=False)
    team_a = models.ManyToManyField(CustomUser, related_name='team_a_matches')
    team_b = models.ManyToManyField(CustomUser, related_name='team_b_matches')
    date = models.DateTimeField(null=False, blank=False)
    teamSize = models.IntegerField(default=1,blank=False, null=False)

    def __str__(self):
        return f'todo'

    def from_match_preview(preview : MatchPreview, score : list[int]):
        team_a = preview.getTeamA()
        team_b = preview.getTeamB()
        now = timezone.now()
        match = Match.objects.create(score_a=score[0], score_b=score[1], date=now, teamSize=preview.teamSize)
        match.team_a.add(*team_a)
        match.team_b.add(*team_b)
        return match

