# E-Voting System v0.4

* Python v3.6
* Django v2.1
* Celery v4.2
* Locust v0.9
* Redis v4
* PostgreSQL v10

## local setup


### create .env file

*look at `.env.example` for inspiration*

### start Redis with Docker

```bash
docker run --name evs-redis -p 6379:6379 -d redis:4-alpine
```

### start Postgres with Docker

#### launch Postgres
```
docker run --name evs-pg -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:10
```

#### create `evs` database

1. enter Postgres console
```
docker exec -it evs-pg psql -U postgres -W
```
(it will ask your password - `postgres`)

2. create databases
```
CREATE DATABASE evs;
\q
```

#### migrate database
```
python manage.py migrate
```

#### create admin account
```
python manage.py createsuperuser
```

#### launch PgAdmin 4
```
docker run --name evs-pgadmin4 \
           --link evs-pg:postgres \
           -p 5050:5050 \
           -d fenglc/pgadmin4:alpine
```


### start Celery

```bash
celery worker -A evs.settings -l INFO --beat
```

### start Django

```bash
python manage.py runserver 8000
```
