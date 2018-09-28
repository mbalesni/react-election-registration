import logging
import random
import string
import pprint

from evs.celeryapp import app
from .bots_api import notifier_bot, passwords_bot
from elists.models import Staff

log = logging.getLogger('tgapp.tasks')


@app.task(bind=True)
def notify(self, message: str):
    log.debug(f'sending message to {notifier_bot.chat_id} ::\n{message[:32]}...')
    notifier_bot.send_message(message=message)
    log.info(f'successfully sent message to {notifier_bot.chat_id}')


@app.task(bind=True)
def reset_passwords(self, usernames: tuple):
    log.debug(f'resetting passwords for {", ".join("@"+un for un in usernames)} ...')

    def rand_pass(size=8):
        chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
        return ''.join(random.choice(chars) for x in range(size))

    username_to_chat_id = passwords_bot.match_username_to_chat_id(usernames=usernames)
    not_found_usernames = set(username_to_chat_id.keys()).symmetric_difference(set(usernames))
    if not_found_usernames:
        error_msg = (
            f'Can not reset passwords: Telegram private chat not found for '
            f'{", ".join("@"+un for un in usernames)}'
        )
        log.error(error_msg)
        return error_msg

    username_to_password = {
        name: rand_pass()
        for name in usernames
    }

    for username, password in username_to_password.items():
        try:
            staff = Staff.objects.get(username=username)
        except Staff.DoesNotExist:
            error_msg = f'Can not reset passwords: staff account with username "{username}" does not exist.'
            log.error(error_msg)
            return error_msg
        else:
            staff.set_password(raw_password=password)
            staff.save()

    log.debug(f'Passwords for {", ".join("@"+un for un in usernames)} reset successfully.')
    log.debug(f'sending messages with passwords...')

    passwords_bot.send_passwords_by_chat_ids(
        chat_id_to_password={
            username_to_chat_id[username]: username_to_password[username]
            for username in usernames
        }
    )

    success_msg = (
        f'Successfully reset passwords for {", ".join("@"+un for un in usernames)} '
        f'and sent messages.'
    )
    return success_msg
