release: python manage.py migrate
web: gunicorn evs.wsgi
worker: celery worker -A evs.celeryapp -l INFO --beat