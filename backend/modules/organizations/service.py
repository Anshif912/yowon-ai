import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database import Organization, OrganizationMember, AuditLog
from modules.organizations.repository import OrganizationRepository
from modules.organizations.schemas import OrganizationCreate
from modules.organizations.exceptions import (
    OrganizationNotFoundException,
    OrganizationSlugTakenException,
    UnauthorizedOrgActionException,
)

class OrganizationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrganizationRepository(db)

    def create_organization(self, payload: OrganizationCreate, owner_uuid: str) -> Organization:
        # Check slug uniqueness
        existing = self.repo.get_by_slug(payload.slug)
        if existing:
            raise OrganizationSlugTakenException()

        org = Organization(
            uuid=str(uuid.uuid4()),
            name=payload.name,
            slug=payload.slug.lower(),
            description=payload.description,
            industry=payload.industry,
            logo_url=payload.logo_url,
            website_url=payload.website_url,
            country=payload.country,
            parent_org_id=payload.parent_org_id,
            owner_id=owner_uuid,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.repo.create(org)

        # Automatically join owner as organization member with owner role
        member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=org.uuid,
            user_id=owner_uuid,
            role="owner",
            joined_at=datetime.utcnow()
        )
        self.db.add(member)

        # Audit logging
        audit = AuditLog(
            actor_id=owner_uuid,
            event_type="CREATE_ORGANIZATION",
            target_entity=org.uuid,
            previous_values=None,
            new_values=f'{{"name": "{org.name}", "slug": "{org.slug}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return org

    def get_organization_by_uuid(self, uuid: str, user_uuid: str) -> Organization:
        org = self.repo.get_active_by_uuid(uuid)
        if not org:
            raise OrganizationNotFoundException()
        return org

    def update_organization(self, uuid: str, payload: OrganizationCreate, user_uuid: str) -> Organization:
        org = self.repo.get_active_by_uuid(uuid)
        if not org:
            raise OrganizationNotFoundException()

        # Check permissions: owner or admin role
        if org.owner_id != user_uuid:
            # Check organization member role
            membership = self.db.query(OrganizationMember).filter(
                OrganizationMember.organization_id == uuid,
                OrganizationMember.user_id == user_uuid
            ).first()
            if not membership or membership.role not in ["owner", "admin"]:
                raise UnauthorizedOrgActionException()

        # Check slug
        if payload.slug.lower() != org.slug:
            existing = self.repo.get_by_slug(payload.slug)
            if existing:
                raise OrganizationSlugTakenException()
            org.slug = payload.slug.lower()

        # Update attributes
        org.name = payload.name
        org.description = payload.description
        org.industry = payload.industry
        org.logo_url = payload.logo_url
        org.website_url = payload.website_url
        org.country = payload.country
        org.parent_org_id = payload.parent_org_id
        org.updated_at = datetime.utcnow()

        self.repo.save()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="UPDATE_ORGANIZATION",
            target_entity=org.uuid,
            previous_values=f'{{"name": "{org.name}", "slug": "{org.slug}"}}',
            new_values=f'{{"name": "{payload.name}", "slug": "{payload.slug}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return org

    def delete_organization(self, uuid: str, user_uuid: str) -> None:
        org = self.repo.get_active_by_uuid(uuid)
        if not org:
            raise OrganizationNotFoundException()

        # Only organization owner can delete
        if org.owner_id != user_uuid:
            raise UnauthorizedOrgActionException()

        # Soft delete: sets deleted_at and deleted_by
        org.deleted_at = datetime.utcnow()
        org.deleted_by = user_uuid
        self.repo.save()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="DELETE_ORGANIZATION",
            target_entity=org.uuid,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

    def restore_organization(self, uuid: str, user_uuid: str) -> Organization:
        org = self.db.query(Organization).filter(Organization.uuid == uuid).first()
        if not org:
            raise OrganizationNotFoundException()

        if org.owner_id != user_uuid:
            raise UnauthorizedOrgActionException()

        # Restore soft delete
        org.deleted_at = None
        org.deleted_by = None
        self.repo.save()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="RESTORE_ORGANIZATION",
            target_entity=org.uuid,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return org

    def list_user_organizations(self, user_uuid: str) -> List[Organization]:
        return self.repo.list_for_user(user_uuid)
