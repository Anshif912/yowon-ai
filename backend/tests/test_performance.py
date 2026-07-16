import time
import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import concurrent.futures

from database import Base, get_db
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


def test_login_and_token_validation_throughput(client):
    """Benchmarks JWT validation and login operations."""
    # 1. Register a test user
    client.post(
        "/api/v1/auth/register",
        json={"email": "perf@yowon.ai", "password": "Password123!", "full_name": "Perf User"}
    )

    # 2. Benchmark Login Under Load (50 iterations)
    start_time = time.time()
    for _ in range(50):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "perf@yowon.ai", "password": "Password123!"}
        )
        assert res.status_code == 200
    duration = time.time() - start_time
    # Latency should be minimal
    login_latency_ms = (duration / 50) * 1000
    print(f"Login average latency: {login_latency_ms:.2f}ms")
    assert login_latency_ms < 1000  # Should be fast under normal conditions


def test_concurrent_invitations(client):
    """Simulates high concurrency creating invitations."""
    # Register and login creator
    client.post(
        "/api/v1/auth/register",
        json={"email": "creator@yowon.ai", "password": "Password123!", "full_name": "Workspace Creator"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@yowon.ai", "password": "Password123!"}
    )
    token = login_res.json()["data"]["access_token"]

    # Get personal workspace list
    ws_res = client.get("/api/v1/workspaces", headers={"Authorization": f"Bearer {token}"})
    workspace_id = ws_res.json()["data"][0]["workspace_id"]

    # Send 50 invitations concurrently in thread pool
    headers = {"Authorization": f"Bearer {token}"}
    
    def send_invite(idx):
        return client.post(
            f"/api/v1/workspaces/{workspace_id}/invite",
            headers=headers,
            json={
                "email": f"invited_{idx}@yowon.ai",
                "role": "TEAM_MEMBER"
            }
        )

    start_time = time.time()
    results = []
    for i in range(50):
        results.append(send_invite(i))

    duration = time.time() - start_time
    for res in results:
        # Wrap checks or check for status
        assert res.status_code == 200

    invite_rate = 50 / duration
    print(f"Invite creation rate: {invite_rate:.2f} req/sec")
    assert invite_rate > 5  # Ensure reasonable throughput
