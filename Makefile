
build:
	docker build -f Dockerfile-front -t pday-regfront:latest .

run:
	docker run -d --name pday-regfront -p 8013:8000 --env-file .env.docker.front pday-regfront

update:
	docker build -f Dockerfile-front -t pday-regfront:latest .
	docker stop pday-regfront
	docker rm pday-regfront
	docker run -d --name pday-regfront -p 8013:8000 --env-file .env.docker.front pday-regfront
	docker logs -f pday-regfront

follow:
	docker logs -f pday-regfront