from typing import List, Optional
from sqlalchemy.orm import Session
from database import EnterpriseConnector, ConnectorSync, ConnectorJob

class ConnectorRepository:
    """Handles CRUD database operations for the connectors package."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, connector_uuid: str) -> Optional[EnterpriseConnector]:
        return self.db.query(EnterpriseConnector).filter(EnterpriseConnector.uuid == connector_uuid).first()

    def get_workspace_connectors(self, workspace_id: str) -> List[EnterpriseConnector]:
        return self.db.query(EnterpriseConnector).filter(EnterpriseConnector.workspace_id == workspace_id).all()

    def create_connector(self, workspace_id: str, name: str, connector_type: str, capabilities_json: str) -> EnterpriseConnector:
        import uuid
        connector = EnterpriseConnector(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=name,
            connector_type=connector_type,
            status="CREATED",
            capabilities_json=capabilities_json
        )
        self.db.add(connector)
        self.db.commit()
        return connector

    def delete_connector(self, connector_uuid: str) -> bool:
        connector = self.get_by_id(connector_uuid)
        if connector:
            self.db.delete(connector)
            self.db.commit()
            return True
        return False
