#!/usr/bin/env bash

echo "IP=$(ip a | grep -A2 'enp4s0f0:' | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1)" >> .env
