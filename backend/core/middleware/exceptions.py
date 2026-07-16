from fastapi import Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
from core.middleware.correlation import correlation_id_ctx

logger = logging.getLogger("yowon.exceptions")

async def global_exception_handler(request: Request, exc: Exception):
    corr_id = correlation_id_ctx.get()
    if isinstance(exc, HTTPException):
        code = "HTTP_ERROR"
        # If detail is structured or contains code
        detail_msg = exc.detail
        if isinstance(exc.detail, dict):
            code = exc.detail.get("code", "HTTP_ERROR")
            detail_msg = exc.detail.get("message", str(exc.detail))
        elif isinstance(exc.detail, str) and exc.detail.isupper():
            code = exc.detail
            
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "apiVersion": "v1",
                "detail": str(detail_msg),
                "success": False,
                "correlation_id": corr_id,
                "error": {
                    "code": code,
                    "message": detail_msg,
                    "details": {}
                }
            }
        )
    
    logger.exception(f"Unhandled system error: {exc}")
    err_msg = str(exc) if str(exc) else "An unhandled server exception occurred."
    return JSONResponse(
        status_code=500,
        content={
            "apiVersion": "v1",
            "detail": err_msg,
            "success": False,
            "correlation_id": corr_id,
            "error": {
                "code": "INTERNAL_SYSTEM_ERROR",
                "message": err_msg,
                "details": {}
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    corr_id = correlation_id_ctx.get()
    method = request.method
    url = str(request.url)
    headers = dict(request.headers)
    query_params = dict(request.query_params)
    path_params = request.path_params
    
    body = None
    try:
        body_bytes = await request.body()
        body = body_bytes.decode("utf-8", errors="ignore")
    except Exception:
        body = "<Unreadable or empty body>"

    details = []
    for error in exc.errors():
        field = " -> ".join(str(p) for p in error.get("loc", []))
        reason = error.get("msg", "Unknown error")
        error_type = error.get("type", "unknown")
        details.append({
            "field": field,
            "reason": reason,
            "type": error_type
        })

    logger.error(
        f"Validation Error 422 - CorrelationID: {corr_id}\n"
        f"Endpoint: {url} | Method: {method}\n"
        f"Headers: {headers}\n"
        f"Query Params: {query_params} | Path Params: {path_params}\n"
        f"Request Body: {body}\n"
        f"Errors: {details}"
    )

    return JSONResponse(
        status_code=422,
        content={
            "apiVersion": "v1",
            "success": False,
            "correlation_id": corr_id,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation Failed",
                "details": details
            }
        }
    )
