import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db, User, Workspace, Team, TeamMember, Project, OwnershipRecord, AuditLog
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


def test_collaboration_workspace_full_flow(client, db_session):
    # 1. Register and Login Creator
    client.post(
        "/api/v1/auth/register",
        json={"email": "creator@yowon.ai", "password": "Password123!", "full_name": "Creator Operator"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@yowon.ai", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Retrieve the automatically bootstrapped PERSONAL workspace
    ws_res = client.get("/api/v1/workspaces", headers=auth_headers)
    assert len(ws_res.json()) == 1
    workspace_id = ws_res.json()[0]["workspace_id"]
    
    # Bind headers with X-Workspace-ID
    ws_headers = {**auth_headers, "X-Workspace-ID": workspace_id}

    # 3. Create a Team inside the workspace
    team_res = client.post(
        "/api/v1/teams",
        headers=ws_headers,
        json={"name": "Phoenix Alpha", "description": "Core engine developers", "team_type": "DEVELOPMENT"}
    )
    assert team_res.status_code == 201
    team = team_res.json()
    assert team["name"] == "Phoenix Alpha"
    assert team["slug"] == "phoenix-alpha"
    team_id = team["uuid"]

    # 4. Generate an invitation to the team
    invite_res = client.post(
        f"/api/v1/teams/{team_id}/invite",
        headers=ws_headers,
        json={"email": "collaborator@yowon.ai", "role": "Developer"}
    )
    assert invite_res.status_code == 200
    invite_code = invite_res.json()["invite_code"]

    # 5. Register User B (Collaborator) and join the team
    client.post(
        "/api/v1/auth/register",
        json={"email": "collaborator@yowon.ai", "password": "Password123!", "full_name": "Collaborator Operator"}
    )
    collab_login = client.post(
        "/api/v1/auth/login",
        json={"email": "collaborator@yowon.ai", "password": "Password123!"}
    )
    collab_token = collab_login.json()["access_token"]
    collab_headers = {"Authorization": f"Bearer {collab_token}"}

    # Accept team invite
    join_res = client.post(
        f"/api/v1/teams/join?code={invite_code}",
        headers=collab_headers
    )
    assert join_res.status_code == 200
    assert join_res.json()["role"] == "Developer"

    # 6. Create a Project in the registry workspace
    proj_res = client.post(
        "/api/v1/projects",
        headers=ws_headers,
        json={
            "name": "Project Aegis",
            "project_type": "Startup",
            "description": "Secure governance proxy registry",
            "team_id": team_id,
            "visibility": "PRIVATE",
            "tags": "security, AST, lock",
            "category": "Security Platform"
        }
    )
    assert proj_res.status_code == 201
    project = proj_res.json()
    assert project["status"] == "REGISTERED"
    project_id = project["id"]

    # Verify initial 100% ownership record is assigned to the creator
    ownership_res = client.get(
        f"/api/v1/projects/{project_id}/ownership",
        headers=ws_headers
    )
    assert len(ownership_res.json()) == 1
    owner_rec = ownership_res.json()[0]
    assert owner_rec["ownership_percentage"] == 100.0
    assert owner_rec["verification_status"] == "Verified"

    # 7. Import repository connections metadata
    import_res = client.post(
        f"/api/v1/projects/{project_id}/import",
        headers=ws_headers,
        json={"repository_url": "https://github.com/yowon-ai/aegis-core", "default_branch": "main"}
    )
    assert import_res.status_code == 200
    assert import_res.json()["status"] == "DEVELOPMENT"

    # Verify connection details metadata
    conn_res = client.get(
        f"/api/v1/projects/{project_id}/repository",
        headers=ws_headers
    )
    assert conn_res.status_code == 200
    assert conn_res.json()["connection_status"] == "CONNECTED"
    assert conn_res.json()["commit_count"] == 34

    # 8. Create a release tag version snapshot
    ver_res = client.post(
        f"/api/v1/projects/{project_id}/version",
        headers=ws_headers,
        json={
            "version": "1.0.0",
            "tag": "v1.0.0",
            "branch": "main",
            "commit_sha": "a1b2c3d4e5f6g7h8i9j0",
            "readme_snapshot": "# Aegis Core\nHighly secured registry service."
        }
    )
    assert ver_res.status_code == 200
    assert ver_res.json()["version"] == "1.0.0"

    # 9. Test secure ownership transfer code handshake
    # Retrieve user B (collaborator) UUID from database
    user_b = db_session.query(User).filter(User.email == "collaborator@yowon.ai").first()
    
    # Initiate transfer from Creator to Collaborator
    tx_res = client.post(
        f"/api/v1/projects/{project_id}/ownership/transfer",
        headers=ws_headers,
        json={"recipient_id": user_b.uuid}
    )
    assert tx_res.status_code == 200
    verification_code = tx_res.json()["verification_code"]

    # Collaborator accepts transfer using the code
    accept_res = client.post(
        f"/api/v1/projects/{project_id}/ownership/transfer?code={verification_code}",
        headers=collab_headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # Verify ownership is transferred
    shares_res = client.get(
        f"/api/v1/projects/{project_id}/ownership",
        headers=ws_headers
    )
    assert shares_res.json()[0]["owner_id"] == user_b.uuid

    # 10. Submission of claim request and conflict classification
    claim_res = client.post(
        f"/api/v1/projects/{project_id}/ownership/request",
        headers=ws_headers,
        json={"reason": "Original author registry claim", "supporting_evidence": "git commits mapping"}
    )
    assert claim_res.status_code == 200
    assert claim_res.json()["status"] == "PENDING"

    # 11. Run universal workspace search
    search_res = client.get(
        f"/api/v1/projects/{project_id}/search?q=Aegis",
        headers=ws_headers
    )
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # 12. Retrieve consolidated workspace timeline feed
    timeline_res = client.get(
        f"/api/v1/projects/{project_id}/timeline",
        headers=ws_headers
    )
    assert timeline_res.status_code == 200
    event_types = [item["event_type"] for item in timeline_res.json()]
    assert "Project Created" in event_types
    assert "Repository Imported" in event_types

    # 13. Verify Audit Logs were written dynamically
    audits = db_session.query(AuditLog).filter(AuditLog.target_entity == project_id).all()
    assert len(audits) >= 1
