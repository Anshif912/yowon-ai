"""
repositories/project_dna_dao.py — Project DNA Data Access Object (DAO)

Encapsulates all persistent database operations for Project DNA snapshots,
fingerprints, features, and comparative genomic sessions.
"""

import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import (
    ProjectDNASnapshot,
    ProjectDNAFeature,
    ProjectDNAFingerprint,
    ComparisonSession,
    ComparisonEvidence
)

logger = logging.getLogger("yowon.project_dna.dao")


class ProjectDNADAO:
    """Encapsulates SQL / ORM operations for Project DNA snapshots and fingerprints."""

    def __init__(self, db: Session):
        self.db = db

    def get_latest_snapshot(self, project_id: str) -> Optional[ProjectDNASnapshot]:
        """Retrieves the latest completed DNA snapshot for a project."""
        return self.db.query(ProjectDNASnapshot).filter(
            ProjectDNASnapshot.project_id == project_id,
            ProjectDNASnapshot.status == "COMPLETED"
        ).order_by(ProjectDNASnapshot.created_at.desc()).first()

    def list_snapshots(self, project_id: str) -> List[ProjectDNASnapshot]:
        """Retrieves historical DNA snapshots for a project."""
        return self.db.query(ProjectDNASnapshot).filter(
            ProjectDNASnapshot.project_id == project_id
        ).order_by(ProjectDNASnapshot.created_at.desc()).all()

    def create_snapshot(
        self,
        project_id: str,
        snapshot_version: str = "v1.0",
        extraction_report: Optional[Dict[str, Any]] = None,
        dna_manifest: Optional[Dict[str, Any]] = None
    ) -> ProjectDNASnapshot:
        """Creates a new ProjectDNASnapshot record."""
        snap = ProjectDNASnapshot(
            snapshot_id=str(uuid.uuid4()),
            project_id=project_id,
            snapshot_version=snapshot_version,
            status="COMPLETED",
            extraction_report=json.dumps(extraction_report) if extraction_report else None,
            dna_manifest=json.dumps(dna_manifest) if dna_manifest else None,
            created_at=datetime.utcnow()
        )
        self.db.add(snap)
        self.db.commit()
        self.db.refresh(snap)
        return snap

    def get_fingerprints(self, snapshot_id: str) -> Optional[ProjectDNAFingerprint]:
        """Retrieves DNA fingerprints for a snapshot."""
        return self.db.query(ProjectDNAFingerprint).filter(
            ProjectDNAFingerprint.snapshot_id == snapshot_id
        ).first()

    def save_fingerprints(
        self,
        snapshot_id: str,
        arch_hash: str,
        tech_hash: str,
        api_hash: str,
        ai_hash: str
    ) -> ProjectDNAFingerprint:
        """Saves genomic hashes for a DNA snapshot."""
        fp = ProjectDNAFingerprint(
            fingerprint_id=str(uuid.uuid4()),
            snapshot_id=snapshot_id,
            architecture_hash=arch_hash,
            technology_hash=tech_hash,
            api_hash=api_hash,
            ai_hash=ai_hash,
            created_at=datetime.utcnow()
        )
        self.db.add(fp)
        self.db.commit()
        self.db.refresh(fp)
        return fp
