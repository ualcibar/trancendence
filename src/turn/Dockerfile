FROM coturn/coturn:alpine
USER root 
RUN apk update && \
    apk upgrade && \
    apk add --no-cache bash curl openssl && \
    rm -rf /var/cache/apk/*

WORKDIR etc/openssl
COPY turnserver.conf /etc/turnserver.conf

CMD ["turnserver", "-c", "/etc/turnserver.conf"]
