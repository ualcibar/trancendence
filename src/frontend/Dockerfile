FROM node:20-alpine

RUN apk update && apk add bash nginx openrc certbot certbot-nginx openssl

WORKDIR /usr/src/app

# RUN chmod 777 start.sh

COPY nginx/nginx.conf /etc/nginx

#CMD ["bash", "-c", "tail -f /dev/null"]
CMD ["./start.sh"]

