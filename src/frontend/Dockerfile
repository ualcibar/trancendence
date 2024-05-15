FROM node:20-alpine

RUN apk update && apk add bash nginx openrc certbot certbot-nginx openssl curl

WORKDIR /usr/src/app

COPY nginx/nginx.conf /etc/nginx
COPY nginx/ssl/server.crt /etc/ssl
COPY nginx/ssl/server.key /etc/ssl

CMD ["./start.sh"]

