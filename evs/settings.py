"""
Django settings for evs project.

Generated by 'django-admin startproject' using Django 2.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/
"""

import os

import raven
import environ

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = environ.Env(
    DEBUG=(bool, False),
    # BACKEND_DOMAIN
    # RAVEN_DSN
    # RAVEN_RELEASE
    # SECRET_KEY
    # DATABASE_URL
)

# reading .env file
environ.Env.read_env(env_file=os.path.join(BASE_DIR, '.env'))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env.str('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG')

BACKEND_DOMAIN = env.str('BACKEND_DOMAIN')

ALLOWED_HOSTS = [BACKEND_DOMAIN, ]


# Application definition

INSTALLED_APPS = [
    'raven.contrib.django.raven_compat',
    'grappelli',
    'corsheaders',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'student.apps.StudentConfig',
    'elists.apps.ElistsConfig',
]

MIDDLEWARE = [
    # Simplified static file serving.
    # https://warehouse.python.org/project/whitenoise/
    'whitenoise.middleware.WhiteNoiseMiddleware',

    # django-cors-headers
    'corsheaders.middleware.CorsMiddleware',

    # Default Django middleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # FIXME: enable CSRF token checks ## 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'evs.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates'
        ,
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            os.path.join(BASE_DIR, 'build'),
        ]
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'evs.wsgi.application'


# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases

DATABASES = {
    'default': env.db_url('DATABASE_URL')
}


# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = 'uk'

TIME_ZONE = 'Europe/Kiev'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [
  os.path.join(BASE_DIR, 'build/static'),
]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# Simplified static file serving.
# https://warehouse.python.org/project/whitenoise/
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'class' : 'logging.Formatter',
            'format': '%(levelname)-8s | %(name)s :: %(message)s',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'detailed',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', ],
            'level': 'INFO',
            'propagate': True,
        },
        'elists': {
            'handlers': ['console', ],
            'level': 'DEBUG',
            'propagate': True,
        }
    },
}


# =============================================================================

# Sessions & Cookies
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_AGE = 30 * 60  # 1800 seconds == 30 minutes


# ELists APP
ELISTS_CHECKINSESSION_TOKEN_EXPIRE = 2 * 60  # 120 seconds == 2 minutes

# Grappelli
GRAPPELLI_SWITCH_USER = False
GRAPPELLI_ADMIN_TITLE = 'EVS Адміністрування'

# Sentry
RAVEN_CONFIG = {
    'dsn': env.str('RAVEN_DSN'),
}
try:
    # If you are using git, you can also automatically configure the
    # release based on the git info.
    RAVEN_CONFIG['release'] = raven.fetch_git_sha(BASE_DIR)
except:
    RAVEN_CONFIG['release'] = env.str('RAVEN_RELEASE', default='onHeroku')

# CORS headers
CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_WHITELIST = [BACKEND_DOMAIN, ]


if DEBUG:
    ELISTS_CHECKINSESSION_TOKEN_EXPIRE = None
    SESSION_COOKIE_AGE = 12 * 60 * 60  # 12 hours
    SESSION_COOKIE_SECURE = False
    SESSION_EXPIRE_AT_BROWSER_CLOSE = False
    SESSION_SAVE_EVERY_REQUEST = False
    GRAPPELLI_SWITCH_USER = True
    ALLOWED_HOSTS += [
        '127.0.0.1',
        'localhost',
    ]
    CORS_ORIGIN_WHITELIST += [
        'localhost:8000',
        'localhost:3000',
        '127.0.0.1:8000',
        '127.0.0.1:3000',
    ]
