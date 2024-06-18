#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import django

ip = os.getenv('IP')

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    django.setup()
#    from matchmaking.models import MatchPreview, Player, Paddle
#    MatchPreview.objects.all().delete()
#    Player.objects.all().delete()
#    Paddle.objects.all().delete()
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
