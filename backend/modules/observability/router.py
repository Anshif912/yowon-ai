import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import SystemHealthResponse, SystemMetricsResponse
from .service import ObservabilityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system", tags=["System Observability"])

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "system-observability-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("/health", response_model=Dict[str, Any])
def get_system_health_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exposes system diagnostic health indicator metrics."""
    service = ObservabilityService(db)
    health = service.check_system_health()
    data = SystemHealthResponse.model_validate(health).model_dump()
    return envelope_response(data)


@router.get("/metrics", response_model=Dict[str, Any])
def get_system_metrics_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gathers connector syncs, active plugins and webhooks logs counts."""
    service = ObservabilityService(db)
    metrics = service.collect_system_metrics()
    data = SystemMetricsResponse.model_validate(metrics).model_dump()
    return envelope_response(data)
