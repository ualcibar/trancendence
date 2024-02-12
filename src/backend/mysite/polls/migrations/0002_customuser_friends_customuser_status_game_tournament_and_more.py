# Generated by Django 5.0 on 2024-02-12 13:16

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('polls', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='friends',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='customuser',
            name='status',
            field=models.CharField(choices=[('connected', 'Connected'), ('disconnected', 'Disconnected'), ('ingame', 'In Game')], default='disconnected', max_length=20),
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('goalsPlayer1', models.IntegerField(default=0)),
                ('goalsPlayer2', models.IntegerField(default=0)),
                ('tournamentGame', models.BooleanField(default=False)),
                ('date', models.DateField()),
                ('player1', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='player1_game', to=settings.AUTH_USER_MODEL)),
                ('player2', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='player2_game', to=settings.AUTH_USER_MODEL)),
                ('winner', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='winner_game', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=60)),
                ('playerNum', models.IntegerField(default=0)),
                ('date', models.DateField()),
                ('final', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='f_game', to='polls.game')),
                ('quarterfinal1', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='q1_game', to='polls.game')),
                ('quarterfinal2', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='q2_game', to='polls.game')),
                ('quarterfinal3', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='q3_game', to='polls.game')),
                ('quarterfinal4', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='q4_game', to='polls.game')),
                ('semifinal1', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='s1_game', to='polls.game')),
                ('semifinal2', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='s2_game', to='polls.game')),
                ('tournamentPlayers', models.ManyToManyField(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.DeleteModel(
            name='Match',
        ),
        migrations.DeleteModel(
            name='MatchState',
        ),
    ]
