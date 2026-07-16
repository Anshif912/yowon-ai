import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, User, Organization, Workspace, Session as UserSessionModel
from main import app

# Set up test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_enterprise_auth.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Ensure starting with clean tables
    db.query(UserSessionModel).delete()
    db.query(Workspace).delete()
    db.query(Organization).delete()
    db.query(User).delete()
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_bootstrap_first_startup_and_installation_wizard():
    # 1. Verify /bootstrap flags first startup correctly
    res = client.get("/api/v1/auth/bootstrap")
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert data["platform_initialized"] is False
    assert data["administrator_exists"] is False
    assert data["registration_allowed"] is True

    # 2. Run /setup-organization installer wizard
    payload = {
        "organization_name": "Test Enterprise Org",
        "admin_name": "Root Administrator",
        "email": "root-admin@yowon.ai",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/v1/auth/setup-organization", json=payload)
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert "access_token" in data
    assert data["user"]["email"] == "root-admin@yowon.ai"
    assert data["user"]["role"] == "admin"
    assert data["user"]["status"] == "active"

    # 3. Verify /bootstrap is now initialized
    res = client.get("/api/v1/auth/bootstrap")
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert data["platform_initialized"] is True
    assert data["administrator_exists"] is True
    assert data["registration_allowed"] is False

    # 4. Verify installer locks (returns 403 Forbidden)
    res = client.post("/api/v1/auth/setup-organization", json=payload)
    assert res.status_code == 403
    assert res.json().get("detail") == "Installation Already Completed."


def test_standard_login_and_logout_flow():
    # Setup database with user manually
    db = TestingSessionLocal()
    from modules.auth.password_service import PasswordService
    user = User(
        uuid="user-uuid-123",
        full_name="Jane Doe",
        email="jane.doe@yowon.ai",
        password_hash=PasswordService.hash_password("YowonAdmin2026!"),
        role="admin",
        status="active",
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.close()

    # 1. Login with invalid password
    res = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@yowon.ai",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert res.json().get("detail") == "Invalid email or password."

    # 2. Login with correct credentials
    res = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@yowon.ai",
        "password": "YowonAdmin2026!"
    })
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert "access_token" in data
    assert data["user"]["email"] == "jane.doe@yowon.ai"

    # Capture cookies
    cookies = res.cookies
    assert "refresh_token" in cookies

    # 3. Request fresh rotated tokens using refresh cookie
    res = client.post("/api/v1/auth/refresh", cookies=cookies)
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert "access_token" in data
    assert res.cookies.get("refresh_token") is not None

    # 4. Terminate active session via logout
    res = client.post("/api/v1/auth/logout", cookies=res.cookies)
    assert res.status_code == 200
    data = res.json().get("data", res.json())
    assert data["success"] is True

    # 5. Subsequent refresh attempts should fail
    res = client.post("/api/v1/auth/refresh", cookies=res.cookies)
    assert res.status_code == 401
