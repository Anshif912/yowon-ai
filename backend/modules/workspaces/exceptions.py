from fastapi import HTTPException, status

class WorkspaceNotFoundException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WORKSPACE_NOT_FOUND"
        )

class UnauthorizedWorkspaceActionException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="UNAUTHORIZED_WORKSPACE_ACTION"
        )

class WorkspaceArchivedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WORKSPACE_IS_ARCHIVED"
        )

class PersonalWorkspaceDeletionException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CANNOT_DELETE_PERSONAL_WORKSPACE"
        )
