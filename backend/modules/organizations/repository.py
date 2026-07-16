from sqlalchemy.orm import Session
from typing import List, Optional
from core.common.base import BaseRepository
from database import Organization, OrganizationMember

class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: Session):
        super().__init__(db, Organization)

    def get_active_by_uuid(self, uuid: str) -> Optional[Organization]:
        return self.db.query(Organization).filter(
            Organization.uuid == uuid,
            Organization.deleted_at.is_(None)
        ).first()

    def get_by_slug(self, slug: str) -> Optional[Organization]:
        return self.db.query(Organization).filter(
            Organization.slug == slug.lower(),
            Organization.deleted_at.is_(None)
        ).first()

    def list_for_user(self, user_uuid: str) -> List[Organization]:
        # Get organizations where user is owner or member
        owned = self.db.query(Organization).filter(
            Organization.owner_id == user_uuid,
            Organization.deleted_at.is_(None)
        ).all()
        
        member_org_ids = self.db.query(OrganizationMember.organization_id).filter(
            OrganizationMember.user_id == user_uuid
        ).subquery()
        
        member_of = self.db.query(Organization).filter(
            Organization.uuid.in_(member_org_ids),
            Organization.deleted_at.is_(None)
        ).all()
        
        # Combine unique orgs
        combined = {org.uuid: org for org in (owned + member_of)}
        return list(combined.values())

    def get_members(self, org_uuid: str) -> List[OrganizationMember]:
        return self.db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org_uuid
        ).all()
