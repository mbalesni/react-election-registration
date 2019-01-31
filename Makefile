
build:
	docker build -f Dockerfile -t pday-regfront:latest .

run:
	docker run -d --name pday-regfront -p 8013:8000 --env-file .env pday-regfront
	docker logs -f pday-regfront

rerun:
	docker stop pday-regfront
	docker rm pday-regfront
	docker run -d --name pday-regfront -p 8013:8000 --env-file .env pday-regfront
	docker logs -f pday-regfront

stop:
	docker stop pday-regfront

start:
	docker start pday-regfront

update:
	docker build -f Dockerfile -t pday-regfront:latest .
	docker stop pday-regfront
	docker rm pday-regfront
	docker run -d --name pday-regfront -p 8013:8000 --env-file .env pday-regfront
	docker logs -f pday-regfront

follow:
	docker logs -f pday-regfront

attach:
	docker --sig-proxy pday-regfront
