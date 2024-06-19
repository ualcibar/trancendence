# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Statistics
from matchmaking.models import MatchPreview, Player, Paddle
from django.db.models.signals import post_migrate

@receiver(post_save, sender=CustomUser)
def create_user_statistics(sender, instance, created, **kwargs):
    if created:
        Statistics.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_statistics(sender, instance, **kwargs):
    instance.statistics.save()

@receiver(post_migrate)
def delete_all_paddle_instances(sender, **kwargs):
    MatchPreview.objects.all().delete()
    Player.objects.all().delete()
    Paddle.objects.all().delete()
