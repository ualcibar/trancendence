FROM python:3.12-alpine3.19 

WORKDIR /usr/src/app

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN apk add bash curl --no-cache

COPY start.sh .
RUN chmod 777 start.sh
CMD ["./start.sh"]
#CMD ["/bin/bash", "-c", "tail -f /dev/null"]