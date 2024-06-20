NAME=Dockerfile
COMPOSE_FILE=docker-compose.yml

$(NAME):
	make run

# Docker volumes & containers management
build:
	@echo "\033[1;33mBuilding containers...\033[0m"
	docker compose -f $(COMPOSE_FILE) build
build_con:
	@echo "\033[1;33mBuilding \033[1;32m$(c) \033[1;33mcontainer...\033[0m"
	cd src; bash ip_to_env.sh; cd ..
	docker compose -f $(COMPOSE_FILE) build $(c)
	@echo "\033[1;33mRaising up \033[1;32m$(c) \033[1;33mcontainer...\033[0m"
	docker compose -f $(COMPOSE_FILE) restart $(c)
	@echo "\033[1;32mDone!\033[0m"
up:
	@echo "\033[1;33mRaising up containers...\033[0m"
	docker compose -f $(COMPOSE_FILE) up -d
stop:
	@echo "\033[1;33mStopping containers...\033[0m"
	docker compose -f $(COMPOSE_FILE) stop
run:
	make ip_to_env
	make build
	make up
	@echo "\033[1;32mAll has been made!\033[0m"
down:
	@echo "\033[1;33mShutting down containers...\033[0m"
	docker compose -f $(COMPOSE_FILE) down --volumes
dwst:
	make down
	make stop
	@echo "\033[1;32mThat's all! See you later\033[0m"

# Cleaning commands
prune:
	docker system prune -f
status:
	docker ps -a
clean:
	make stop
	make down
	make clean_ip
	@echo "\n\033[1;33mCleaning... \033[0m"
	docker rmi -f postgres:latest src-backend src-frontend
	docker system prune -f
cleanVolumes:
	docker volume ls -q
	docker volume rm --force $$(docker volume ls -q)

re:
	@echo "🔁 \033[1;33mResetting everything... \033[0m"
	make clean
	make run
	make status

ip_to_env:
	bash ip_to_env.sh

clean_ip:
	bash clean.sh

reip:
	make clean_ip
	make ip_to_env

.PHONY: build build_con up stop run down dwst prune status clean cleanVolumes re ip_to_env clean_ip reip
