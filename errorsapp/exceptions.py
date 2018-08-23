import abc
import pprint


class BaseExceptionWithCode(Exception, metaclass=abc.ABCMeta):

    code: int

    def __init__(self, context: dict =None):
        msg = f'[errno{self.code}] {self.__class__.__name__}'
        if context:
            msg += f':\n{pprint.pformat(context)}'

        self._message = msg
        self._context = context

        super().__init__(self._message)

    @property
    def get_code(self) -> int:
        return self.code


class BaseWorkflowError(BaseExceptionWithCode, metaclass=abc.ABCMeta):

    pass


class BaseProgrammingError(BaseWorkflowError, metaclass=abc.ABCMeta):

    pass


class BaseUserError(BaseWorkflowError, metaclass=abc.ABCMeta):

    pass
