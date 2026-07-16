from fastapi import HTTPException, status

class UserExistsException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="USER_ALREADY_EXISTS"
        )

class InvalidCredentialsException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_EMAIL_OR_PASSWORD"
        )

class AccountLockedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_TEMPORARILY_LOCKED"
        )

class AccountDeactivatedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_DEACTIVATED"
        )
