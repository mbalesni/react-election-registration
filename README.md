# E-Voting System

* Python v3.6
* Django v2.0
* PostgreSQL v10

### start Postgres with Docker

#### launch Postgres
```
docker run --name evs-pg
           -e POSTGRES_PASSWORD=postgres
           -d postgres:10
```

#### create `evs` database

1. enter Postgres console
```
docker exec -it evs-pg psql -U postgres -W
```
(it will ask your password - `postgres`)

2. create database
```
postgres=# CREATE DATABASE evs;
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
