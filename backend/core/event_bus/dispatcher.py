import logging
from typing import Callable, Dict, List
from core.event_bus.contracts import EventEnvelope

logger = logging.getLogger("yowon.event_bus")

class EventDispatcher:
    _listeners: Dict[str, List[Callable[[EventEnvelope], None]]] = {}

    @classmethod
    def subscribe(cls, event_type: str, callback: Callable[[EventEnvelope], None]) -> None:
        if event_type not in cls._listeners:
            cls._listeners[event_type] = []
        cls._listeners[event_type].append(callback)
        logger.info(f"Subscribed callback to event type: {event_type}")

    @classmethod
    def dispatch(cls, envelope: EventEnvelope) -> None:
        event_type = envelope.event_type
        if event_type in cls._listeners:
            for callback in cls._listeners[event_type]:
                try:
                    callback(envelope)
                except Exception as e:
                    logger.error(f"Error handling event {event_type} inside callback: {str(e)}")
        else:
            logger.debug(f"No active listeners subscribed to event: {event_type}")
