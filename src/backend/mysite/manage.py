#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import django


def create_superuser():
    from polls.models import CustomUser
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser(username='admin', password='1234')
        print("Superuser created successfully.")
    else:
        print("Superuser already exists.")


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
    django.setup()  # Initialize Django
#    create_superuser()
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
