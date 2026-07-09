"""
engine_contract.py — Isolated engine execution wrapper & scheduling model.
"""

import time
import logging
from enum import Enum
from typing import Any, Dict, List, Optional, Callable
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class EngineStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    WARNING = "WARNING"
    SKIPPED = "SKIPPED"
    PARTIAL = "PARTIAL"
    CACHE_HIT = "CACHE_HIT"
    CACHE_MISS = "CACHE_MISS"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class EngineResult(BaseModel):
    """
    Structured outcome returned by every single code intelligence engine.
    Allows complete isolation, timing logging, and execution timeline mapping.
    """
    engine_name: str
    status: EngineStatus = EngineStatus.SUCCESS
    duration: float = 0.0
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    payload: Any = None
    memory: float = 0.0
    confidence: float = 1.0
    coverage: float = 1.0


def run_isolated_engine(
    name: str,
    func: Callable[..., Any],
    fallback_payload: Any = None,
    quality_gate_min_confidence: float = 0.0,
    *args: Any,
    **kwargs: Any
) -> EngineResult:
    """
    Executes a specific intelligence engine within a protected try/except boundary.
    Captures duration, memory changes, warnings, and formats as a structured EngineResult.
    """
    t_start = time.perf_counter()
    import os
    try:
        import psutil
        process = psutil.Process(os.getpid())
        mem_start = process.memory_info().rss / (1024 * 1024)
    except Exception:
        mem_start = 0.0

    warnings: List[str] = []
    errors: List[str] = []
    status = EngineStatus.SUCCESS
    payload = fallback_payload
    confidence = 1.0
    coverage = 1.0
    metrics: Dict[str, Any] = {}

    try:
        logger.info(f"[EngineRunner] Starting isolated engine: {name}")
        # Run function
        payload = func(*args, **kwargs)
        
        # Calculate metric counts if possible
        if isinstance(payload, list):
            metrics["count"] = len(payload)
        elif isinstance(payload, dict):
            metrics["count"] = len(payload)
            if "nodes" in payload and "edges" in payload:
                metrics["nodes_count"] = len(payload["nodes"])
                metrics["edges_count"] = len(payload["edges"])

        # Determine confidence if present in payload (Mathematical confidence defaults)
        if hasattr(payload, "confidence"):
            confidence = getattr(payload, "confidence")
        elif isinstance(payload, dict) and "confidence" in payload:
            confidence = payload["confidence"]
        
        # Enforce quality gate checks (Phase 3 quality gates)
        if confidence < quality_gate_min_confidence:
            status = EngineStatus.WARNING
            warnings.append(f"Quality gate warning: Engine confidence {confidence:.2f} is below minimum requirement {quality_gate_min_confidence:.2f}")

    except Exception as exc:
        status = EngineStatus.FAILED
        err_msg = f"Engine {name} failed: {exc}"
        logger.exception(err_msg)
        errors.append(err_msg)
        payload = fallback_payload
        confidence = 0.0
        coverage = 0.0

    t_end = time.perf_counter()
    duration = t_end - t_start

    try:
        import psutil
        process = psutil.Process(os.getpid())
        mem_end = process.memory_info().rss / (1024 * 1024)
        mem_diff = max(0.0, mem_end - mem_start)
    except Exception:
        mem_diff = 0.0

    return EngineResult(
        engine_name=name,
        status=status,
        duration=round(duration, 4),
        warnings=warnings,
        errors=errors,
        metrics=metrics,
        payload=payload,
        memory=round(mem_diff, 2),
        confidence=confidence,
        coverage=coverage
    )
