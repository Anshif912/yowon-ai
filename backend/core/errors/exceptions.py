class YowonException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class ConcurrencyException(YowonException):
    def __init__(self, message: str = "Resource modified by another actor"):
        super().__init__("SYSTEM_002", message, 409)

class LifecycleTransitionException(YowonException):
    def __init__(self, message: str):
        super().__init__("PROJECT_002", message, 400)
