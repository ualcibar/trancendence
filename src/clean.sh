#!/usr/bin/env bash

sed -i '/^IP=/d' .env
sed -i 's/ip = ".*";/ip = "localhost";/g' frontend/angular/src/main.ts
sed -i 's/id42 = ".*";/id42 = "cuarentaidos";/g' frontend/angular/src/main.ts