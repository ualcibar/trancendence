from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, username, password, **extra_fields):
        if not username or not password:
            raise ValueError('Password and username are required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    # Add custom fields here
    username = models.CharField(max_length=20, unique=True, blank=False,
                                null=False)

    # avatar = models.ImageField(upload_to='avatars/', blank=True, null=False)
    # install pyllow to make it work

    is_active = models.BooleanField(default=True, null=False)
    is_staff = models.BooleanField(default=False, null=False)
    is_superuser = models.BooleanField(default=False, null=False)

    wins = models.PositiveIntegerField(default=0, null=False, blank=True)
    loses = models.PositiveIntegerField(default=0, null=False, blank=True)
    total = models.PositiveIntegerField(default=0, null=False, blank=True)

    objects = CustomUserManager('self', symmetrical=True)

    friends = models.ManytoMany(CustomUser)

    USERNAME_FIELD = 'username'
    # Add any additional required fields
    REQUIRED_FIELDS = []

    STATUS_CHOICES = [
            ('connected', 'Connected'),
            ('disconnected', 'Disconnected'),
            ('ingame', 'In Game'),
            ]
    status = models.CharField(
            max_length=20,
            choices=STATUS_CHOICES,
            default='disconnected',
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
    tournamentPlayers = models.ManyToMany(CustomUser, symmetrical=False)

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
