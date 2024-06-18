#!/usr/bin/env bash

IP=$(ip a | grep -A2 'enp4s0f0:' | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1)

#If the first one does not work:
if [ -z "$IP" ]; then
  echo "Auxiliary IP setted"
  IP=$(ip a | grep -A2 '1:' | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1)
fi

echo "IP=$IP" >> .env