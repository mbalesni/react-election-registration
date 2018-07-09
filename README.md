
Python: 3.6
Django: 2.0
PostgreSQL: 10

### start Postgres with Docker

#### launch Postgres
```
docker run --name elists-pg
           -e POSTGRES_PASSWORD=postgres
           -d postgres:10
```

#### create `elists` database

1. enter Postgres console
```
docker exec -it elists-pg psql -U postgres -W
```
(it will ask your password - `postgres`)

2. create database
```
postgres=# CREATE DATABASE elists;
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
docker run --name elists-pgadmin4 \
           --link elists-pg:postgres \
           -p 5050:5050 \
           -d fenglc/pgadmin4:alpine
```
