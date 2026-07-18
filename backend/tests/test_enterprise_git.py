import pytest
import hmac
import hashlib
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db, Workspace, GitOrganization, GitRepository, RepositoryWebhook, RepositoryCloneCache, RepositoryStatistics
from main import app
from modules.auth.secrets_vault import SecretsVaultService
from modules.git.providers import get_git_provider
from modules.git.webhooks import verify_signature

# Setup in-memory database for VCS unit tests
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db_session")
def fixture_db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def fixture_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_secrets_vault_encryption():
    """Verify that credentials are encrypted/decrypted consistently."""
    plain_token = "ghp_secret_access_token_9876543210"
    encrypted = SecretsVaultService.encrypt_token(plain_token)
    assert encrypted != plain_token
    
    decrypted = SecretsVaultService.decrypt_token(encrypted)
    assert decrypted == plain_token

def test_secrets_vault_expiration(db_session):
    """Verify expired secrets are detected and return None on retrieval."""
    # Store token with expiration set in the past
    secret = SecretsVaultService.store_oauth_token(
        db=db_session,
        connector_id="conn-123",
        token="expired_secret_val",
        expires_in_seconds=-10
    )
    token = SecretsVaultService.get_oauth_token(db_session, "conn-123")
    assert token is None

def test_vcs_provider_factory():
    """Verify provider factory returns the correct concrete implementation."""
    provider = get_git_provider("github")
    assert provider.__class__.__name__ == "GitHubProvider"
    
    with pytest.raises(ValueError):
        get_git_provider("unsupported_vcs_provider")

def test_webhook_signature_verification():
    """Verify webhook signature matching works for HMAC payloads."""
    secret = "yowon_webhook_secret_key"
    payload = b'{"ref": "refs/heads/main", "after": "sha123"}'
    
    # Valid signature
    mac = hmac.new(secret.encode("utf-8"), msg=payload, digestmod=hashlib.sha256)
    valid_sig = "sha256=" + mac.hexdigest()
    assert verify_signature(payload, secret, valid_sig) is True
    
    # Invalid signature
    assert verify_signature(payload, secret, "sha256=invalid_hash_signature") is False

def test_git_operations_endpoints(client, db_session):
    """Test repository REST API endpoints for explorer list and details view."""
    ws = Workspace(name="Test Workspace", type="PERSONAL")
    db_session.add(ws)
    db_session.flush()
    
    org = GitOrganization(workspace_id=ws.workspace_id, name="Test Org", login="testorg")
    db_session.add(org)
    db_session.flush()

    repo = GitRepository(
        organization_id=org.uuid,
        workspace_id=ws.workspace_id,
        name="testrepo",
        full_name="testorg/testrepo",
        html_url="https://github.com/testorg/testrepo"
    )
    db_session.add(repo)
    db_session.flush()
    
    stats = RepositoryStatistics(
        repository_id=repo.uuid,
        health_score=94,
        coverage=85,
        estimated_remediation_cost=1200.0
    )
    db_session.add(stats)
    db_session.commit()

    # 1. Fetch repositories list
    response = client.get("/api/v1/git/repositories")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["full_name"] == "testorg/testrepo"
    assert response.json()[0]["statistics"]["health_score"] == 94

    # 2. Verify details endpoint
    details_resp = client.get(f"/api/v1/git/repositories/{repo.uuid}")
    assert details_resp.status_code == 200
    assert details_resp.json()["statistics"]["health_score"] == 94
    assert details_resp.json()["name"] == "testrepo"

def test_policy_and_watchlist_updates(client, db_session):
    """Test updating repository continuous evaluation policy and watchlist toggles."""
    ws = Workspace(name="Test Workspace", type="PERSONAL")
    db_session.add(ws)
    db_session.flush()

    repo = GitRepository(
        workspace_id=ws.workspace_id,
        name="policy-repo",
        full_name="testorg/policy-repo",
        html_url="https://github.com/testorg/policy-repo"
    )
    db_session.add(repo)
    db_session.commit()

    # Update policy
    resp = client.post(f"/api/v1/git/repositories/{repo.uuid}/policy", json={"policy": "PUSH"})
    assert resp.status_code == 200
    assert resp.json()["evaluation_policy"] == "PUSH"
    
    # Update watchlist
    resp = client.post(f"/api/v1/git/repositories/{repo.uuid}/watchlist", json={"active": True, "rules": "notify_on_drop"})
    assert resp.status_code == 200
    assert resp.json()["watchlist_active"] is True

def test_cache_lifecycle(client, db_session):
    """Test clone cache directory creation, listing, and deletion lifecycle."""
    ws = Workspace(name="Test Workspace", type="PERSONAL")
    db_session.add(ws)
    db_session.flush()

    repo = GitRepository(
        workspace_id=ws.workspace_id,
        name="cache-repo",
        full_name="testorg/cache-repo",
        html_url="https://github.com/testorg/cache-repo"
    )
    db_session.add(repo)
    db_session.flush()

    cache = RepositoryCloneCache(
        repository_id=repo.uuid,
        path="/tmp/yowon/cache-repo",
        size_bytes=1048576,
        last_accessed_at=datetime.utcnow()
    )
    db_session.add(cache)
    db_session.commit()

    # List caches
    list_resp = client.get("/api/v1/git/cache")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["path"] == "/tmp/yowon/cache-repo"

    # Delete cache
    del_resp = client.delete(f"/api/v1/git/cache/{cache.uuid}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "PURGED"

def test_repository_comparison(client, db_session):
    """Test repository comparison deltas math logic."""
    ws = Workspace(name="Test Workspace", type="PERSONAL")
    db_session.add(ws)
    db_session.flush()

    repo1 = GitRepository(
        workspace_id=ws.workspace_id,
        name="repo1",
        full_name="testorg/repo1",
        html_url="https://github.com/testorg/repo1"
    )
    repo2 = GitRepository(
        workspace_id=ws.workspace_id,
        name="repo2",
        full_name="testorg/repo2",
        html_url="https://github.com/testorg/repo2"
    )
    db_session.add(repo1)
    db_session.add(repo2)
    db_session.flush()

    stats1 = RepositoryStatistics(repository_id=repo1.uuid, health_score=90, technical_debt=10, coverage=80)
    stats2 = RepositoryStatistics(repository_id=repo2.uuid, health_score=94, technical_debt=12, coverage=85)
    db_session.add(stats1)
    db_session.add(stats2)
    db_session.commit()

    compare_resp = client.post("/api/v1/git/repositories/compare", json={
        "base_repo_id": repo1.uuid,
        "target_repo_id": repo2.uuid
    })
    assert compare_resp.status_code == 200
    data = compare_resp.json()
    assert data["delta"]["health_diff"] == 4
    assert data["delta"]["tech_debt_diff"] == 2
    assert data["delta"]["coverage_diff"] == 5

def test_unified_search_indexing(client, db_session):
    """Test global unified search querying across repositories and PRs."""
    ws = Workspace(name="Test Workspace", type="PERSONAL")
    db_session.add(ws)
    db_session.flush()

    repo = GitRepository(
        workspace_id=ws.workspace_id,
        name="matching-repo",
        full_name="testorg/matching-repo",
        html_url="https://github.com/testorg/matching-repo"
    )
    db_session.add(repo)
    db_session.commit()

    search_resp = client.get("/api/v1/git/search?q=matching")
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) == 1
    assert results[0]["type"] == "repository"
    assert results[0]["title"] == "testorg/matching-repo"
