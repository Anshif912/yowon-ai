import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db, User, Workspace, WorkspaceMember, WorkspaceInvitation
from main import app

# Setup in-memory SQLite database
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
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_sql_injection_protection(client):
    """Verifies that SQL injection payloads do not break database operations."""
    response = client.post(
        "/auth/register",
        json={
            "email": "injected' OR '1'='1@yowon.ai",
            "password": "Password123!",
            "full_name": "SQL Injection User"
        }
    )
    # Registration should either succeed or fail gracefully, but not throw a DB error
    assert response.status_code in [201, 400]


def test_unauthorized_workspace_access(client):
    """Verifies that endpoints require authentication."""
    response = client.get("/workspaces")
    assert response.status_code == 401


def test_cross_workspace_isolation(client, db_session):
    """Verifies that User A cannot access or modify Workspace B which belongs to User B."""
    # 1. Register User A
    client.post(
        "/auth/register",
        json={"email": "usera@yowon.ai", "password": "Password123!", "full_name": "User A"}
    )
    login_a = client.post(
        "/auth/login",
        json={"email": "usera@yowon.ai", "password": "Password123!"}
    )
    token_a = login_a.json()["access_token"]

    # 2. Register User B
    client.post(
        "/auth/register",
        json={"email": "userb@yowon.ai", "password": "Password123!", "full_name": "User B"}
    )
    login_b = client.post(
        "/auth/login",
        json={"email": "userb@yowon.ai", "password": "Password123!"}
    )
    token_b = login_b.json()["access_token"]

    # Retrieve User B's personal workspace ID from database
    user_b = db_session.query(User).filter(User.email == "userb@yowon.ai").first()
    ws_b = db_session.query(Workspace).filter(Workspace.owner_id == user_b.uuid).first()

    # User A tries to view User B's Workspace
    response = client.get(
        f"/workspaces/{ws_b.workspace_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code in [403, 404]


def test_personal_workspace_deletion_protection(client, db_session):
    """Verifies that personal workspaces cannot be deleted."""
    client.post(
        "/auth/register",
        json={"email": "user@yowon.ai", "password": "Password123!", "full_name": "Test User"}
    )
    login_res = client.post(
        "/auth/login",
        json={"email": "user@yowon.ai", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    user = db_session.query(User).filter(User.email == "user@yowon.ai").first()
    ws = db_session.query(Workspace).filter(Workspace.owner_id == user.uuid).first()

    # Attempt to delete personal workspace
    response = client.delete(
        f"/workspaces/{ws.workspace_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400


def test_refresh_token_rotation_invalidation(client):
    """Verifies that refresh token rotation invalidates the old token."""
    client.post(
        "/auth/register",
        json={"email": "rotate@yowon.ai", "password": "Password123!", "full_name": "Rotation User"}
    )
    login_res = client.post(
        "/auth/login",
        json={"email": "rotate@yowon.ai", "password": "Password123!"}
    )
    
    # Retrieve refresh token cookie
    refresh_token = login_res.cookies.get("refresh_token")
    assert refresh_token is not None

    # First refresh succeeds
    client.cookies.set("refresh_token", refresh_token)
    refresh_res_1 = client.post("/auth/refresh")
    assert refresh_res_1.status_code == 200
    
    # Old token reuse must fail
    client.cookies.set("refresh_token", refresh_token)
    refresh_res_2 = client.post("/auth/refresh")
    assert refresh_res_2.status_code == 401
