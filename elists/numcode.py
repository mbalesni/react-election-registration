import logging

from tgapp import tasks

log = logging.getLogger('elists.numcode')


OFFSET = 20_000_000
SPACE = 100_000_000


def gen_numerical_code(seed: int, key: int) -> int:
    MODULE_BY = SPACE - OFFSET
    assert key % MODULE_BY != 0
    assert key > SPACE

    return OFFSET + (seed * key) % MODULE_BY


class NumCodeGen:

    def __init__(self):
        self.__secret = 7681279397995

        self.log_secret(self.__secret)

    @classmethod
    def log_secret(cls, secret: int):
        msg = f'Numeric code generator initiated with secret: `{secret}`'
        log.info(msg)
        tasks.notify(msg)

    def encode(self, data: int) -> int:
        try:
            assert isinstance(data, int)
            assert 0 < data < SPACE
            encoded = gen_numerical_code(
                seed=data,
                key=self.__secret
            )
        except AssertionError as exc:
            err_msg = f'Check failed: {str(exc)}'
            log.critical(err_msg)
            tasks.notify(err_msg)
            raise RuntimeError(err_msg) from exc
        else:
            log.debug(f'New numerical code generated for {data} - {encoded}')
            return encoded
