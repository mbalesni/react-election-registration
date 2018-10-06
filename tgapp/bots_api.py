import abc

import telegram
import requests
from django.conf import settings


PARSE_MODE = 'markdown'


def get_message_updates(bot_token):
    url = f'https://api.telegram.org/bot{bot_token}/getUpdates'
    payload = {'allowed_updates': ['message', ]}
    response = requests.post(url, data=payload)
    resp_json = response.json()

    return resp_json['result']


class TGBot(metaclass=abc.ABCMeta):
    PARSE_MODE = 'markdown'

    def __init__(self, bot_token: str):
        self._bot_token = bot_token
        self._bot = telegram.Bot(token=bot_token)

    @property
    def bot_token(self) -> str:
        return self._bot_token

    def _send_message(self, content: str, *, chat_id: int):
        self._bot.send_message(
            chat_id=chat_id,
            text=content,
            parse_mode=self.PARSE_MODE,
        )

    def _send_doc(self, file_obj, *, chat_id: int):
        self._bot.send_document(
            chat_id=chat_id,
            document=file_obj,
        )


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
            self._send_message(
                content=message,
                chat_id=chat_id,
            )


class NotifierBot(TGBot):

    def __init__(self, bot_token: str, chat_id: int):
        super().__init__(bot_token=bot_token)

        self._chat_id = int(chat_id)

    @property
    def chat_id(self) -> int:
        return self._chat_id

    def send_message(self, message: str):
        self._send_message(
            chat_id=self._chat_id,
            content=message,
        )

    def send_doc(self, file_obj):
        self._send_doc(file_obj=file_obj, chat_id=self._chat_id)


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
