# Generated by Django 5.0 on 2024-02-27 13:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('polls', '0002_customuser_friends_customuser_status_game_tournament_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_42_user',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='refresh_token42',
            field=models.CharField(default=None, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='token42',
            field=models.CharField(default=None, null=True),
        ),
    ]
