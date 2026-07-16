import logging
from datetime import datetime
from database import AuditLog

logger = logging.getLogger("yowon.teams.events")

def dispatch_team_audit(db, actor_id: str, event_type: str, target: str, prev: str = None, new: str = None, corr_id: str = None):
    try:
        audit = AuditLog(
            actor_id=actor_id,
            event_type=event_type,
            target_entity=target,
            previous_values=prev,
            new_values=new,
            correlation_id=corr_id or "system",
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.flush()
    except Exception as e:
        logger.error(f"Failed to log audit event {event_type} on target {target}: {str(e)}")
