import uuid
import contextvars
import time
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
import json
import logging

logger = logging.getLogger("yowon.observability")

# Context variables for holding correlation ID and active organization ID
correlation_id_ctx = contextvars.ContextVar("correlation_id", default="")
organization_id_ctx = contextvars.ContextVar("organization_id", default="")

class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Generate or capture correlation ID
        corr_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        correlation_id_ctx.set(corr_id)

        # Generate or capture organization ID
        org_id = request.headers.get("X-Organization-ID") or ""
        organization_id_ctx.set(org_id)

        # Proceed with request
        response: Response = await call_next(request)

        # Measure request duration (Observability)
        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            f"[Request Log] Correlation ID: {corr_id} | Path: {request.url.path} | "
            f"Method: {request.method} | Status Code: {response.status_code} | "
            f"Duration: {duration_ms:.2f}ms | Org ID: {org_id}"
        )

        # Attach to response headers
        response.headers["X-Correlation-ID"] = corr_id
        response.headers["X-API-Version"] = "v1"
        if org_id:
            response.headers["X-Organization-ID"] = org_id

        # If it's a versioned API or Auth response, and is a JSONResponse, format the schema
        # Check content type and successful status code
        if (
            request.url.path.startswith("/api/v1")
            and response.headers.get("content-type") == "application/json"
            and response.status_code < 400
        ):
            # We must load response body and wrap it
            body = [section async for section in response.body_iterator]
            response.body_iterator = None  # Reset body iterator
            
            try:
                original_data = json.loads(b"".join(body).decode("utf-8"))
                
                # Check if already wrapped
                if isinstance(original_data, dict) and "apiVersion" in original_data:
                    wrapped_data = original_data
                else:
                    wrapped_data = {
                        "apiVersion": "v1",
                        "success": True,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "correlation_id": corr_id,
                        "data": original_data,
                        "meta": {}
                    }
                
                wrapped_body = json.dumps(wrapped_data).encode("utf-8")
                
                # Create brand new response
                new_response = Response(
                    content=wrapped_body,
                    status_code=response.status_code,
                    media_type="application/json"
                )
                # Keep headers preserving duplicates (like multiple Set-Cookie)
                new_response.headers.clear()
                for k, v in response.headers.multi_items():
                    if k.lower() != "content-length":
                        new_response.headers.append(k, v)
                new_response.headers["content-length"] = str(len(wrapped_body))
                new_response.headers["X-Correlation-ID"] = corr_id
                new_response.headers["X-API-Version"] = "v1"
                return new_response
            except Exception:
                # If json loading failed, return original response body
                # Reconstruct body iterator
                async def re_iterator():
                    yield b"".join(body)
                response.body_iterator = re_iterator()

        return response
