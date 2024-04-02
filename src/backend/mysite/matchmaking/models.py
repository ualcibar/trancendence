from django.db import models, IntegrityError, transaction
from polls.models import CustomUser

class MatchPreview(models.Model):
    max_players = 2
    name = models.CharField(max_length=128, null=False, unique=True)
    tags = models.CharField(max_length=128, null=False)
    public = models.BooleanField(default=False, null=False)
    host = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    players = models.ManyToManyField(to=CustomUser, blank=True)

    def add_player(self,match_name, user):
        try:
            with transaction.atomic():
                match = self.objects.select_for_update().get(name=match_name)
                if match.players.count() < self.max_players:
                    match.players.add(user)
                    return True
                else:
                    return False
        except (IntegrityError, cls.DoesNotExist):
            return False


    def __str__(self):
        return f'match name={self.name} host={self.host}'
