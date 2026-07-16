"""
event_bus.py — Lightweight in-process Event Bus for YOWON AI.

Publishes named events with correlation IDs to all registered subscribers.
Subscribers run synchronously inside the same request context for simplicity.
For async fan-out or persistence, swap with a Redis Pub/Sub or RabbitMQ adapter.
"""

import logging
import uuid
from datetime import datetime
from typing import Callable, Dict, List, Any

logger = logging.getLogger("yowon.event_bus")

_subscribers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}


def subscribe(event_name: str, handler: Callable[[Dict[str, Any]], None]) -> None:
    """Registers a handler for a named event."""
    _subscribers.setdefault(event_name, []).append(handler)
    logger.debug(f"[EventBus] Subscribed handler '{handler.__name__}' to event '{event_name}'")


def publish(event_name: str, payload: Dict[str, Any], correlation_id: str = None) -> str:
    """
    Publishes an event to all registered subscribers.

    Returns the correlation_id used for this event dispatch.
    """
    cid = correlation_id or str(uuid.uuid4())
    envelope = {
        "event": event_name,
        "correlation_id": cid,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "payload": payload,
    }
    logger.info(f"[EventBus] Publishing event='{event_name}' correlation_id={cid}")
    for handler in _subscribers.get(event_name, []):
        try:
            handler(envelope)
        except Exception as exc:
            logger.error(f"[EventBus] Handler '{handler.__name__}' failed for event '{event_name}': {exc}")
    return cid
