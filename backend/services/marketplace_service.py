"""
services/marketplace_service.py — MarketplaceService v1 & Extension Ecosystem

Encapsulates all domain business logic for Extension Catalog Discovery,
1-Click Plugin Installation/Uninstallation, Configuration, and Repository Recommendations.
"""

import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from repositories.marketplace_dao import MarketplaceDAO

logger = logging.getLogger("yowon.services.marketplace")


class MarketplaceService:
    """Versioned Domain Service v1 for Enterprise Extension Marketplace."""

    CATALOG = [
        {
            "plugin_id": "security-sentinel-pro",
            "name": "Security Sentinel Pro",
            "category": "Security",
            "author": "YOWON Security Team",
            "rating": 4.9,
            "downloads": 14200,
            "description": "Deep vulnerability scanner and secrets detection ruleset extension."
        },
        {
            "plugin_id": "architecture-linter",
            "name": "Architectural Drift Linter",
            "category": "Architecture",
            "author": "YOWON Core",
            "rating": 4.8,
            "downloads": 9800,
            "description": "Automated layer separation & dependency cycle enforcement."
        },
        {
            "plugin_id": "jira-issue-automation",
            "name": "Jira & Linear Auto-Sync",
            "category": "Integrations",
            "author": "YOWON Integrations",
            "rating": 4.7,
            "downloads": 12500,
            "description": "Automatically opens Jira tickets when critical security vulnerabilities are detected."
        },
        {
            "plugin_id": "slack-alert-stream",
            "name": "Slack Enterprise Stream",
            "category": "Notifications",
            "author": "YOWON Community",
            "rating": 4.9,
            "downloads": 18300,
            "description": "Real-time evaluation alert stream for team Slack channels."
        }
    ]

    def __init__(self, db: Session):
        self.db = db
        self.dao = MarketplaceDAO(db)

    def list_plugins(self, workspace_id: str = "default-ws") -> List[Dict[str, Any]]:
        """Lists extension catalog with installation statuses."""
        installed_ids = {p.plugin_id for p in self.dao.list_installed(workspace_id=workspace_id)}

        results = []
        for item in self.CATALOG:
            is_inst = item["plugin_id"] in installed_ids
            results.append({
                **item,
                "is_installed": is_inst,
                "status": "INSTALLED" if is_inst else "AVAILABLE"
            })
        return results

    def install_plugin(self, plugin_id: str, workspace_id: str = "default-ws") -> Dict[str, Any]:
        """Installs or activates an extension plugin."""
        inst = self.dao.install_plugin(plugin_id=plugin_id, workspace_id=workspace_id)
        return {
            "installation_id": inst.uuid,
            "plugin_id": inst.plugin_id,
            "status": "INSTALLED_ACTIVE"
        }
