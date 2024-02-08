from django.db import models

# Create your models here.


class Avatar(models.Model):
    image = models.ImageField(upload_to='avatars/', default='default_avatar.png')

class User(models.Model):
    nickname = models.CharField(max_length=60)
    password = models.CharField(max_length=60, default='SOME STRING')
    winGames = models.IntegerField(default=0)
    lostGames = models.IntegerField(default=0)
    totalGames = models.IntegerField(default=0)
    #avatarImage = models.OneToOneField(
    #    Avatar,
    #    on_delete=models.CASCADE,
    #)
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

    def __str__(self):
        return self.nickname

class Game(models.Model):
    player1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='player1_game',
    )
    player2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='player2_game',
    )
    goalsPlayer1 = models.IntegerField(default=0)
    goalsPlayer2 = models.IntegerField(default=0)
    winner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='winner_game',
    )
    tournamentGame = models.BooleanField(default=False)
    date = models.DateField()

    def __str__(self):
        return self.winner

class Friend(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE,related_name='friend_user1',)
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_user2',)
    
    class Meta:
        unique_together = ['user1', 'user2']
    
    def __str__(self):
        return f"{self.user1.nickname} and {self.user2.nickname}'s friendship"

class Tournament(models.Model):
    title = models.CharField(max_length=60)
    playerNum = models.IntegerField(default=0)
    quarterfinal1 = models.OneToOneField(
        Game,
        on_delete = models.CASCADE,
        related_name='q1_game',
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

    def __str__(self):
        return f"{self.title} winner: {self.final.winner}"

class TournamentPlayers(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
    )
    player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return f"{self.tournament.title} and {self.player.nickname}"
