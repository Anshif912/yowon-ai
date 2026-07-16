from fastapi.responses import JSONResponse

def format_error_response(code: str, message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "apiVersion": "v1",
            "success": False,
            "error": {
                "code": code,
                "message": message
            }
        }
    )
