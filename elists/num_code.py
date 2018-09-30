import logging

from tgapp.tasks import tg_notify

log = logging.getLogger('elists.numcode')


class NumCodeGen:

    def __init__(self):
        self.__secret = 7_651_279_397_995
        self.__offset = 37

        self._result_space = 10**8
        self._result_offset = 2 * 10**7

        self._result_moduler = self._result_space - self._result_offset

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
        encoded = self._result_offset + result % self._result_moduler

        log.debug(f'New numerical code generated for {data} - {encoded}')
        return encoded


num_code_generator = NumCodeGen()
