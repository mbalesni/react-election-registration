import abc

import requests


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

            username = chat['username']
            if username not in usernames:
                continue

            chat_id = chat['id']
            if chat_id > 0:
                result[username] = chat_id

        return result

    def send_messages_by_usernames(self, username_to_message: dict):
        usernames = tuple(username_to_message.keys())

        username_to_chat_id = self.match_username_to_chat_id(usernames=usernames)

        for username in usernames:
            send_message(
                bot_token=self._bot_token,
                chat_id=username_to_chat_id[username],
                message=username_to_message[username],
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
