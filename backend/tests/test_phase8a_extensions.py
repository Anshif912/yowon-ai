import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, User, Workspace, WorkspaceMember, MarketplaceItem
from main import app
from auth.security import get_current_user

# Setup test database
TEST_DATABASE_URL = "sqlite:///test_phase8a_extensions.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from fastapi import Depends
from sqlalchemy.orm import Session

# Active mock user override
mock_user = User(
    uuid="test-user-p8",
    email="admin@yowon.ai",
    password_hash="mock",
    full_name="Phase 8 Admin",
    role="WORKSPACE_ADMIN",
    status="ACTIVE"
)

def override_get_current_user(db: Session = Depends(get_db)):
    return db.query(User).filter(User.uuid == "test-user-p8").first()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed workspace and user in db
    db = TestingSessionLocal()
    ws = Workspace(
        workspace_id="test-ws-p8",
        name="Phase 8 Workspace",
        created_at=datetime.utcnow()
    )
    db.add(ws)
    
    db.add(mock_user)
    
    member = WorkspaceMember(
        workspace_id="test-ws-p8",
        user_id="test-user-p8",
        role="WORKSPACE_ADMIN",
        status="ACTIVE"
    )
    db.add(member)
    
    # Seed marketplace item
    item = MarketplaceItem(
        uuid="mock-slack-marketplace-item",
        name="Slack Notification Hub",
        item_type="plugin",
        publisher="yowon",
        trust_score=5.0,
        downloads=0,
        is_verified=True
    )
    db.add(item)
    
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


# ── SECRETS VAULT TESTS ───────────────────────────────────────────────────────

def test_secrets_vault_operations(db_session):
    from core.security.secrets.vault import SecretsVaultService
    vault = SecretsVaultService(db_session)

    # 1. Store
    secret_id = vault.store("mock-connector-id", "pat", "ghp_mock_token_value_123")
    assert secret_id is not None

    # 2. Get (should write access log)
    val = vault.get(secret_id, actor_id="test-user-p8")
    assert val == "ghp_mock_token_value_123"

    from database import SecretAccessLog
    logs = db_session.query(SecretAccessLog).filter(SecretAccessLog.secret_id == secret_id).all()
    assert len(logs) == 1
    assert logs[0].actor_id == "test-user-p8"

    # 3. Rotate
    new_ver = vault.rotate(secret_id, "ghp_rotated_token_456")
    assert new_ver == 2
    assert vault.get(secret_id, actor_id="test-user-p8") == "ghp_rotated_token_456"

    # 4. Revoke
    vault.revoke(secret_id)
    with pytest.raises(ValueError):
        vault.get(secret_id, actor_id="test-user-p8")


# ── CONNECTORS PLATFORM TESTS ─────────────────────────────────────────────────

def test_connectors_api(client):
    headers = {"X-Workspace-Id": "test-ws-p8"}

    # 1. Register
    payload = {
        "name": "Production GitHub Enterprise",
        "connector_type": "github",
        "secret_value": "ghp_production_token"
    }
    r = client.post("/api/v1/connectors", json=payload, headers=headers)
    assert r.status_code == 200
    res_data = r.json()["data"]
    connector_id = res_data["uuid"]
    assert res_data["name"] == "Production GitHub Enterprise"
    assert res_data["status"] == "ACTIVE"

    # 2. Diagnostics
    r = client.get(f"/api/v1/connectors/{connector_id}/diagnostics", headers=headers)
    assert r.status_code == 200
    diag_data = r.json()["data"]
    assert diag_data["connectivity"] == "REACHABLE"
    assert diag_data["latency_ms"] > 0

    # 3. Sync
    r = client.post(f"/api/v1/connectors/{connector_id}/sync", headers=headers)
    assert r.status_code == 200
    sync_data = r.json()["data"]
    assert sync_data["sync_status"] == "SUCCESS"
    assert sync_data["records_synced"] == 42

    # 4. Rotate Secret
    r = client.post(f"/api/v1/connectors/{connector_id}/rotate-secret?new_secret_value=ghp_new_rotated", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["rotated"] is True


# ── MARKETPLACE AND PLUGINS TESTS ─────────────────────────────────────────────

def test_marketplace_and_plugins_api(client):
    headers = {"X-Workspace-Id": "test-ws-p8"}

    # 1. List Marketplace
    r = client.get("/api/v1/marketplace", headers=headers)
    assert r.status_code == 200
    items = r.json()["data"]
    assert len(items) > 0

    # 2. Install Plugin from Marketplace
    payload = {"marketplace_item_id": "mock-slack-marketplace-item"}
    r = client.post("/api/v1/plugins/install", json=payload, headers=headers)
    assert r.status_code == 200
    plugin_data = r.json()["data"]
    assert plugin_data["name"] == "Slack Notification Hub"
    assert plugin_data["is_verified"] is True
    plugin_id = plugin_data["uuid"]

    # 3. List installed plugins
    r = client.get("/api/v1/plugins", headers=headers)
    assert r.status_code == 200
    plugins = r.json()["data"]
    assert len(plugins) > 0

    # 4. Uninstall
    r = client.post(f"/api/v1/plugins/uninstall?plugin_id={plugin_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["uninstalled"] is True


# ── WEBHOOKS TESTS ────────────────────────────────────────────────────────────

def test_webhooks_api(client, db_session):
    headers = {"X-Workspace-Id": "test-ws-p8"}

    # 1. Register Webhook
    payload = {
        "target_url": "https://api.sentinel.internal/webhook-receiver",
        "events": ["DNA_GENERATED", "DECISION_COMPLETED"]
    }
    r = client.post("/api/v1/webhooks", json=payload, headers=headers)
    assert r.status_code == 200
    wh_data = r.json()["data"]
    assert wh_data["target_url"] == "https://api.sentinel.internal/webhook-receiver"
    webhook_id = wh_data["uuid"]

    # 2. Trigger Event using WebhookService
    from modules.webhooks.service import WebhookService
    service = WebhookService(db_session)
    deliveries = service.trigger_outbound_webhook(
        workspace_id="test-ws-p8",
        event_name="DNA_GENERATED",
        payload={"project_id": "mock-proj", "security_risk": 0.12}
    )
    assert len(deliveries) == 1
    delivery_id = deliveries[0].uuid
    assert deliveries[0].status == "SUCCESS"
    assert deliveries[0].response_code == 200

    # 3. Replay Delivery via API
    r = client.post(f"/api/v1/webhooks/replays?delivery_id={delivery_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["replayed"] is True


# ── OBSERVABILITY TESTS ───────────────────────────────────────────────────────

def test_system_observability(client):
    headers = {"X-Workspace-Id": "test-ws-p8"}

    # 1. Health
    r = client.get("/api/v1/system/health", headers=headers)
    assert r.status_code == 200
    health = r.json()["data"]
    assert health["status"] == "HEALTHY"
    assert health["secrets_vault_healthy"] is True

    # 2. Metrics
    r = client.get("/api/v1/system/metrics", headers=headers)
    assert r.status_code == 200
    metrics = r.json()["data"]
    assert "connector_syncs_total" in metrics
    assert "plugins_installed" in metrics
