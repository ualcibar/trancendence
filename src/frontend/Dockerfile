FROM node:20-alpine

RUN apk update && apk add bash

WORKDIR /usr/src/app

COPY start.sh .

RUN chmod 777 start.sh
#CMD ["bash", "-c", "tail -f /dev/null"]
CMD ["./start.sh"]

