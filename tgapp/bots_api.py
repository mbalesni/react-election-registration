import abc

import requests
from django.conf import settings


PARSE_MODE = 'markdown'


def get_message_updates(bot_token):
    url = f'https://api.telegram.org/bot{bot_token}/getUpdates'
    payload = {'allowed_updates': ['message', ]}
    response = requests.post(url, data=payload)
    resp_json = response.json()

    return resp_json['result']


def send_message(bot_token: str, chat_id: str, message: str):
    url = f'https://api.telegram.org/bot{bot_token}/sendmessage'
    payload = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': PARSE_MODE,
    }

    resp = requests.post(url, data=payload)


class TGBot(metaclass=abc.ABCMeta):

    def __init__(self, bot_token: str):
        self._bot_token = bot_token

    @property
    def bot_token(self) -> str:
        return self._bot_token


class UsernameBot(TGBot):

    def match_username_to_chat_id(self, usernames: tuple) -> dict:
        result = {}

        for update in get_message_updates(bot_token=self._bot_token):
            message = update.get('message', None)
            if message is None:
                continue

            chat = message['chat']

            chat_type = chat['type']
            if chat_type != 'private':
                continue

            username = chat['username']
            if username not in usernames:
                continue

            chat_id = chat['id']
            result[username] = chat_id

        return result

    def send_passwords_by_chat_ids(self, chat_id_to_password: dict):
        for chat_id, password in chat_id_to_password.items():
            message = (f'Ваш пароль для входу в систему електронних виборів:\n'
                       f'`{password}`\n'
                       f'Не передавайте його нікому!')
            send_message(
                bot_token=self._bot_token,
                chat_id=chat_id,
                message=message,
            )


class NotifierBot(TGBot):

    def __init__(self, bot_token: str, chat_id: str):
        super().__init__(bot_token=bot_token)

        self._chat_id = chat_id

    @property
    def chat_id(self) -> str:
        return self._chat_id

    def send_message(self, message: str):
        send_message(
            bot_token=self._bot_token,
            chat_id=self._chat_id,
            message=message,
        )


passwords_bot = UsernameBot(
    bot_token=settings.TG_PASSWORDS_BOT_TOKEN,
)
notifier_bot = NotifierBot(
    bot_token=settings.TG_NOTIFIER_BOT_TOKEN,
    chat_id=settings.TG_NOTIFIER_CHAT_ID,
)
publisher_bot = NotifierBot(
    bot_token=settings.TG_PUBLISHER_BOT_TOKEN,
    chat_id=settings.TG_PUBLISHER_CHAT_ID,
)
