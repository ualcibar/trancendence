from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

import logging
logger = logging.getLogger('std')

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password, token_verification=None, **extra_fields):
        if not username or not password:
            raise ValueError('Password and username are required')
        user = self.model(username=username, email=email, token_verification=token_verification, **extra_fields)
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

    def create_superuser(self, username, email, password, token_verification=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, token_verification=token_verification, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    # Add custom fields here
    '''
    id unique id uuid
    password passwword
    '''
    username = models.CharField(max_length=20, unique=True, blank=False,
                                null=False)

    avatar = models.ImageField(default='avatars/default.jpg', upload_to='avatars/', blank=True, null=False)
    # install pyllow to make it work

    email = models.CharField(max_length=320, unique=True, blank=False, null=True)
    token_2FA = models.CharField(max_length=6, blank=True, null=True)
    is_2FA_active = models.BooleanField(default=False, null=False)
    token_verification = models.CharField(max_length=64, blank=True, null=True)
    verification_bool = models.BooleanField(default=False, null=False)
    
    is_anonymized = models.BooleanField(default=False, null=False)
    anonymized_at = models.DateTimeField(null=True, blank=True)

    game_room_name = models.CharField(max_length=255, default=None, blank=True, null=True) 
    game = models.ForeignKey('matchmaking.MatchPreview', default=None,blank=True, null=True, on_delete=models.SET_NULL) 
    is_42_user = models.BooleanField(default=False, null=False)
    id42 = models.UUIDField(None, default=None, blank=True, null=True, editable=True, unique=True)
    token42 = models.CharField(max_length=255, default=None, blank=True, null=True)
    refresh_token42 = models.CharField(default=None, max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True, null=False)

    is_staff = models.BooleanField(default=False, null=False)
    is_superuser = models.BooleanField(default=False, null=False)

    objects = CustomUserManager()

    friends = models.ManyToManyField('CustomUser', symmetrical=True, blank=True, related_name='my_friends')
    blockedUsers = models.ManyToManyField('CustomUser', blank=True, related_name='blocked_users')

    USERNAME_FIELD = 'username'
    # Add any additional required fields
    REQUIRED_FIELDS = []


    CONNECTED = "Connected"
    DISCONNECTED = "Disconnected"
    JOINING_GAME = "JoiningGame"
    IN_GAME = "InGame"
    STAND_BY = "Standby"
    STATUS_CHOICES = {
        CONNECTED: 'Connected',
        DISCONNECTED: 'Disconnected',
        JOINING_GAME: 'JoiningGame',
        IN_GAME: 'InGame',
    }

    PREVIOUS_STATUS_CHOICES = (
        (IN_GAME, 'InGame'),
        (STAND_BY, 'Standby'),
    )

    status = models.CharField(
            max_length=20,
            choices=STATUS_CHOICES,
            default=DISCONNECTED,
            )
    previous_status = models.CharField(
            max_length=20,
            choices=PREVIOUS_STATUS_CHOICES,
            default=STAND_BY,
            )
    
    COLOR_CHOICES = (
        ('default','Default'),
        ('rojo', 'Rojo'),
        ('naranja', 'Naranja'),
        ('ambar', 'Ambar'),
        ('lima', 'Lima'),
        ('pino', 'Pino'),
        ('purpura', 'Purpura'),
    )

    color = models.CharField(
        max_length=10,
        choices=COLOR_CHOICES,
        default='default',
    )

    LANGUAGE_CHOICES = (
        ('eu', 'Euskera'),
        ('en', 'English'),
        ('es', 'Spanish'),
    )

    language = models.CharField(
        max_length=8,
        choices=LANGUAGE_CHOICES,
        default='en',
    )

    def has_module_perms(self, app_label):
        # This method should return True if the user has permissions to view the app `app_label`
        return self.is_staff

    def has_perm(self, perm, obj=None):
        # This method should return True if the user has the specified permission
        return self.is_staff

    def get_username(self):
        return self.username
    
    def clearGameRelated(self):
        self.status = self.CONNECTED
        self.game = None
        self.game_room_name = None
        self.save()

    def __str__(self):
        return self.username

class Statistics(models.Model):
    wins = models.IntegerField(default=0, blank=True, null=False)
    loses = models.IntegerField(default=0, blank=True, null=False)
    total = models.IntegerField(default=0, blank=True, null=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="statistics")

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
'''
class Friend(models.Model):
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='friend_user1',)
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='friend_user2',)

    class Meta:
        unique_together = ['user1', 'user2']

    def __str__(self):
        return f"{self.user1.nickname} and {self.user2.nickname}'s friendship"
'''

