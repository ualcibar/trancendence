openssl genrsa -out cert.key 2048
openssl req -new -key cert.key -out cert.csr
openssl x509 -req -days 3650 -in cert.csr -signkey cert.key -out cert.crt
turnserver -c /etc/turnserver.conf