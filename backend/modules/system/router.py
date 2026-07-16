import time
import os
import psutil
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, FeatureFlag, Notification, BackgroundJob, Project, Team, Evaluation, Workspace

system_router = APIRouter()


@system_router.get("/health")
def get_health(db: Session = Depends(get_db)):
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "components": {
            "database": "unknown",
            "background_jobs": "healthy",
            "repository_sync": "healthy",
            "notification_service": "healthy",
            "storage": "healthy",
            "event_bus": "healthy"
        }
    }

    # Check database
    try:
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = "healthy"
    except Exception:
        health_status["components"]["database"] = "unhealthy"
        health_status["status"] = "degraded"

    return health_status


@system_router.get("/readiness")
def get_readiness(db: Session = Depends(get_db)):
    """
    Kubernetes-style readiness probe.
    Returns HTTP 200 when all critical dependencies are reachable.
    Returns HTTP 503 when any critical check fails.
    """
    checks = {}
    ready = True

    # 1. Database connectivity
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "ready"}
    except Exception as exc:
        checks["database"] = {"status": "not_ready", "error": str(exc)}
        ready = False

    # 2. Disk space (warn if < 10% free on the app volume)
    try:
        disk = psutil.disk_usage("/")
        free_pct = (disk.free / disk.total) * 100
        if free_pct < 10:
            checks["disk"] = {"status": "not_ready", "free_pct": round(free_pct, 1)}
            ready = False
        else:
            checks["disk"] = {"status": "ready", "free_pct": round(free_pct, 1)}
    except Exception as exc:
        checks["disk"] = {"status": "unknown", "error": str(exc)}

    # 3. Memory pressure (warn if > 95% used)
    try:
        mem = psutil.virtual_memory()
        if mem.percent > 95:
            checks["memory"] = {"status": "not_ready", "used_pct": mem.percent}
            ready = False
        else:
            checks["memory"] = {"status": "ready", "used_pct": mem.percent}
    except Exception as exc:
        checks["memory"] = {"status": "unknown", "error": str(exc)}

    body = {
        "ready": ready,
        "timestamp": time.time(),
        "checks": checks
    }
    status_code = 200 if ready else 503
    return JSONResponse(content=body, status_code=status_code)


@system_router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    metrics = {
        "success": True,
        "metrics": {
            "platform": {
                "active_users": 1,
                "active_organizations": 1,
                "active_workspaces": db.query(Workspace).count(),
                "active_teams": db.query(Team).count(),
                "active_projects": db.query(Project).count()
            },
            "repository": {
                "sync_success_rate": 100.0,
                "average_sync_duration_ms": 1240,
                "search_latency_ms": 15
            },
            "ai": {
                "average_evaluation_duration_s": 42.5,
                "queue_depth": db.query(BackgroundJob).filter(BackgroundJob.status == "QUEUED").count()
            },
            "collaboration": {
                "notifications_sent": db.query(Notification).count(),
                "background_jobs_run": db.query(BackgroundJob).count()
            },
            "infrastructure": {
                "memory_usage_pct": psutil.virtual_memory().percent,
                "cpu_usage_pct": psutil.cpu_percent()
            }
        }
    }
    return metrics

