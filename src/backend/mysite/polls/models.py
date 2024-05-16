from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password, **extra_fields):
        if not username or not password:
            raise ValueError('Password and username are required')
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create42user(self, meInfo):
        '''
    check if the login is used
    if CustomUser.objects.filter(username=response['login']) != None:
        return error
    check if the user id is being used
    if CustomUser.objects.filter(42user=true, 42id=reponse['42id']) != None:
        return error
    create a user for 42 oauth
    user = CustomUser.objects.create_user42(username=response['login'], token, refreshtoken, 42id)
    if user == None:
        return error
    '''
        if not meInfo['login']:
            raise ValueError('login is required')
        user = self.model(username=meInfo['login'], is_42_user=True, id42=meInfo['id'])
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    # Add custom fields here
    '''
    id unique id uuid
    password passwword
    '''
    username = models.CharField(max_length=20, unique=True, blank=False,
                                null=False)

    # avatar = models.ImageField(upload_to='avatars/', blank=True, null=False)
    # install pyllow to make it work

    email = models.CharField(max_length=320, unique=True, blank=False, null=False)

    game_room_name = models.CharField(max_length=255, default=None, null=True) 
    game = models.ForeignKey('matchmaking.MatchPreview', default=None, null=True, on_delete=models.SET_NULL) 
    is_42_user = models.BooleanField(default=False, null=False)
    id42 = models.UUIDField(None, null=True, editable=True, unique=True)
    token42 = models.CharField(max_length=255, default=None, null=True)
    refresh_token42 = models.CharField(default=None, max_length=255, null=True)

    is_active = models.BooleanField(default=True, null=False)

    is_staff = models.BooleanField(default=False, null=False)
    is_superuser = models.BooleanField(default=False, null=False)

    wins = models.PositiveIntegerField(default=0, null=False, blank=True)
    loses = models.PositiveIntegerField(default=0, null=False, blank=True)
    total = models.PositiveIntegerField(default=0, null=False, blank=True)

    objects = CustomUserManager()

    friends = models.ManyToManyField('self', symmetrical=True)

    USERNAME_FIELD = 'username'
    # Add any additional required fields
    REQUIRED_FIELDS = []


    STATUS_CHOICES = (
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('joining_game', 'Joining Game'),
        ('in_game', 'In Game'),
    )

    status = models.CharField(
            max_length=20,
            choices=STATUS_CHOICES,
            default='Disconnected',
            )
    
    USER_COLOR_CHOICES = (
        ('default','default'),
        ('rojo', 'rojo'),
        ('naranja', 'naranja'),
        ('ambar', 'ambar'),
        ('lima', 'lima'),
        ('pino', 'pino'),
        ('purpura', 'purpura'),
    )

    user_color = models.CharField(
        max_length=10,
        choices=USER_COLOR_CHOICES,
        default='default',
    )

    def has_module_perms(self, app_label):
        # This method should return True if the user has permissions to view the app `app_label`
        return self.is_staff

    def has_perm(self, perm, obj=None):
        # This method should return True if the user has the specified permission
        return self.is_staff

    def get_username(self):
        return self.username

    def __str__(self):
        return self.username

'''
class MatchState(models.Model):
    name = models.CharField(max_length=20, null=False, blank=False)

        States:
            Starting
            Running
            Player1 wins
            Player2 wins
            Tie
            Error


    def __str__(self):
        return self.name


class Match(models.Model):
    date_played = models.DateTimeField("date match happened")
    players = models.ManyToManyField(CustomUser)
    state = models.ForeignKey(MatchState, on_delete=models.CASCADE)

    '''


class Game(models.Model):
    player1 = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='player1_game',
    )
    player2 = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='player2_game',
    )
    goalsPlayer1 = models.IntegerField(default=0)
    goalsPlayer2 = models.IntegerField(default=0)
    winner = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='winner_game',
    )
    tournamentGame = models.BooleanField(default=False)
    date = models.DateField()

    def __str__(self):
        return self.winner

'''
class Friend(models.Model):
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='friend_user1',)
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='friend_user2',)

    class Meta:
        unique_together = ['user1', 'user2']

    def __str__(self):
        return f"{self.user1.nickname} and {self.user2.nickname}'s friendship"
'''


class Tournament(models.Model):
    title = models.CharField(max_length=60)
    playerNum = models.IntegerField(default=0)
    quarterfinal1 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name = 'q1_game',
            )
    quarterfinal2 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='q2_game',
            )
    quarterfinal3 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='q3_game',
            )
    quarterfinal4 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='q4_game',
            )
    semifinal1 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='s1_game',
            )
    semifinal2 = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='s2_game',
            )
    final = models.OneToOneField(
            Game,
            on_delete = models.CASCADE,
            related_name='f_game',
            )
    date = models.DateField()
    tournamentPlayers = models.ManyToManyField(CustomUser, symmetrical=False)

    def __str__(self):
        return f"{self.title} winner: {self.final.winner}"

'''
class TournamentPlayers(models.Model):
    tournament = models.ForeignKey(
            Tournament,
            on_delete=models.CASCADE,
            )
    player = models.ForeignKey(
            CustomUser,
            on_delete=models.CASCADE,
            )

    def __str__(self):
        return f"{self.tournament.title} and {self.player.nickname}"

'''
