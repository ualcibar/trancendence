#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import django
import time
import subprocess


def ping():
    try:
        subprocess.run(['ping', '-c', '1', 'localhost:5432'], check=True, stdout=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError:
        return False


def wait_for_postgres():
    """
    Wait for PostgreSQL database to start by attempting to ping it.
    """
    delay = 1
    retries = 60 #timeout of 60 secs more or less
    while retries > 0:
        if ping():
            print("Database is now reachable.")
            return
        print("Database is not yet reachable. Retrying...")
        time.sleep(delay)
    print("Unable to connect to the database.")


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
    wait_for_postgres()
    create_superuser()
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
