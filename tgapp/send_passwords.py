import requests


def get_message_updates(bot_token):
    url = f'https://api.telegram.org/bot{bot_token}/getUpdates'
    payload = {'allowed_updates': ['message', ]}
    response = requests.post(url, data=payload)
    resp_json = response.json()

    return resp_json['result']


def get_chat_ids(bot_token: str, usernames: tuple):
    result = {}

    for update in get_message_updates(bot_token):
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


def send_message(bot_token: str, chat_id: str, content: str):
    url = f'https://api.telegram.org/bot{bot_token}/sendmessage'
    payload = {
        'chat_id': chat_id,
        'text': content,
    }

    resp = requests.post(url, data=payload)
