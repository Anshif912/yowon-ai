import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, DateTime, String

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SoftDeleteMixin:
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(36), nullable=True)

class UUIDMixin:
    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
