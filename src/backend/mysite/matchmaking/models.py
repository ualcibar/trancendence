from django.db import models
from polls.models import CustomUser

class MatchPreview(models.Model):
    name = models.CharField(max_length=128, null=False, unique=True)
    tags = models.CharField(max_length=128, null=False)
    public = models.BooleanField(default=False, null=False)
    host = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return f'match name={self.name} host={self.host}'
