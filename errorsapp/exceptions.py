import abc
import pprint


def camelcase_to_lower(initial_string: str) -> str:
    output = [initial_string[0].lower()]
    for c in initial_string[1:]:
        if c in ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
            output.append(' ')
            output.append(c.lower())
        else:
            output.append(c)
    return str.join('', output)


# ============
# base classes
# ------------

class BaseExceptionWithCode(Exception, metaclass=abc.ABCMeta):

    code: int

    def __init__(self, context: dict =None):
        msg = f'[errno{self.get_code()}] {self.get_name()}'
        if context:
            msg += f':\n{pprint.pformat(context)}'

        self._message = msg
        self._context = context or {}

        super().__init__(self._message)

    def get_code(self) -> int:
        return self.code

    def get_name(self) -> str:
        return camelcase_to_lower(self.__class__.__name__)

    def get_context(self) -> dict:
        return self._context.copy()


class BaseWorkflowError(BaseExceptionWithCode, metaclass=abc.ABCMeta):

    pass


class BaseProgrammingError(BaseWorkflowError, metaclass=abc.ABCMeta):

    pass


class BaseUserError(BaseWorkflowError, metaclass=abc.ABCMeta):

    pass

# end of base classes
# ===================


# ===============
# workflow errors
# ---------------

class WorkflowError(BaseWorkflowError):
    code = 100

# end of workflow errors
# ======================


# ==================
# programming errors
# ------------------

class ProgrammingError(BaseProgrammingError):
    code = 300


class TicketNumberWrongFormat(BaseProgrammingError):
    code = 301


class MissingCheckInSessionToken(BaseProgrammingError):
    code = 303


class CheckInSessionWrongStatus(BaseProgrammingError):
    code = 304


class CheckInSessionWithoutStudent(BaseProgrammingError):
    code = 305


class CheckInSessionAlreadyClosed(BaseProgrammingError):
    code = 306


class StudentDocNumberWrongFormat(BaseProgrammingError):
    code = 309


class StudentDocTypeWrongFormat(BaseProgrammingError):
    code = 310


class StudentStatusAlreadyTheSame(BaseProgrammingError):
    code = 311


class StudentStatusCantChangeBecauseVoted(BaseProgrammingError):
    code = 312


class StudentStatusCantChangeBecauseFree(BaseProgrammingError):
    code = 313


class CheckInSessionTokenBadSignature(BaseUserError):
    code = 314


class StudentTokenBadSignature(BaseUserError):
    code = 315

# end of programming errors
# =========================


# ===========
# user errors
# -----------

class TicketNumberNotFound(BaseUserError):
    code = 501


class StaffHasOpenSession(BaseUserError):
    code = 502


class StudentNotAllowedToAssign(BaseUserError):
    code = 504


class CheckInSessionTokenExpired(BaseUserError):
    code = 508

# end of user errors
# ==================
