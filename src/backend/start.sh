#!/bin/bash

cd /usr/src/app/mysite

python manage.py makemigrations
python manage.py migrate

daphne -p 8000 --bind 0.0.0.0 mysite.asgi:application

#python manage.py runserver 0.0.0.0:8000 &

#tail -f /dev/null
