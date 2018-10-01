import logging
import secrets

from tgapp.tasks import tg_notify

log = logging.getLogger('elists.numcode')


class NumCodeGen:

    def __init__(self):
        self.__secret = 2_651_579_387_927
        self.__offset = 29_837

        self.log_secret(
            secret=self.__secret,
            offset=self.__offset,
        )

    @classmethod
    def log_secret(cls, secret: int, offset: int):
        msg = f'Numeric code generator initiated with secret=`{secret}` and offset=`{offset}`'
        log.info(msg)
        tg_notify(msg)

    def encode(self, data: int) -> int:
        result = (data + self.__offset) * self.__secret

        salt = secrets.randbelow(800) + 200
        encoded = result % 100_000 + salt * 100_000

        log.debug(f'New numerical code generated for {data} - {encoded}')
        return encoded


num_code_generator = NumCodeGen()
