from fastapi import HTTPException, status

class OrganizationNotFoundException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ORGANIZATION_NOT_FOUND"
        )

class OrganizationSlugTakenException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ORGANIZATION_SLUG_ALREADY_TAKEN"
        )

class UnauthorizedOrgActionException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="UNAUTHORIZED_ORGANIZATION_ACTION"
        )
