#!/usr/bin/env bash

sed -i '/^IP=/d' .env
sed -i 's/ip = ".*";/ip = "localhost";/g' frontend/angular/src/main.ts