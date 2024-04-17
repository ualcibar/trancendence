#!/bin/bash
echo "Initializing nginx..."
echo ""
openrc
touch /run/openrc/softlevel

rc-service nginx start
rc-service nginx status

echo ""
echo "Initializing Angular..."
npm install
npm install -g @angular/cli
npm fund

# npm run dev
tail -f /dev/null
