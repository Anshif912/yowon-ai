import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db, User
from main import app
from auth.security import verify_password

# Setup in-memory SQLite database for auth tests
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db_session")
def fixture_db_session():
    """Fixture that creates database schemas and yields a scoped session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client")
def fixture_client(db_session):
    """Fixture that overrides get_db dependency and returns FastAPI test client."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_register_success(client):
    """Verifies that registration registers a user correctly."""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@yowon.ai",
            "password": "securepassword123!",
            "full_name": "Test Operator"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@yowon.ai"
    assert data["full_name"] == "Test Operator"
    assert "password_hash" not in data
    assert data["role"] == "user"


def test_register_duplicate_fails(client):
    """Verifies that duplicate registration returns HTTP 400."""
    # First registration
    client.post(
        "/auth/register",
        json={
            "email": "duplicate@yowon.ai",
            "password": "securepassword123!",
            "full_name": "First Operator"
        }
    )
    # Duplicate registration
    response = client.post(
        "/auth/register",
        json={
            "email": "duplicate@yowon.ai",
            "password": "anotherpassword123!",
            "full_name": "Duplicate Operator"
        }
    )
    assert response.status_code == 400
    assert "exists" in response.json()["detail"]


def test_login_success(client, db_session):
    """Verifies that correct credentials returns JWT token and sets HTTPOnly cookie."""
    # Register user
    client.post(
        "/auth/register",
        json={
            "email": "login@yowon.ai",
            "password": "loginpassword123!",
            "full_name": "Login Operator"
        }
    )
    
    # Login request
    response = client.post(
        "/auth/login",
        json={
            "email": "login@yowon.ai",
            "password": "loginpassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@yowon.ai"
    
    # Verify cookie presence
    cookies = response.cookies
    assert "refresh_token" in cookies
    assert "access_token" in cookies


def test_failed_login_lockout(client, db_session):
    """Verifies that 5 failed attempts locks the account."""
    # Register user
    client.post(
        "/auth/register",
        json={
            "email": "lockout@yowon.ai",
            "password": "correctpassword123!",
            "full_name": "Lockout Operator"
        }
    )

    # 4 failed attempts
    for _ in range(4):
        response = client.post(
            "/auth/login",
            json={
                "email": "lockout@yowon.ai",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401

    # Check user is not locked yet
    user = db_session.query(User).filter(User.email == "lockout@yowon.ai").first()
    assert user.failed_login_attempts == 4
    assert not user.account_locked

    # 5th failed attempt -> lock account
    response = client.post(
        "/auth/login",
        json={
            "email": "lockout@yowon.ai",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    
    # Check user database record
    db_session.refresh(user)
    assert user.failed_login_attempts == 5
    assert user.account_locked

    # Attempt login with correct password -> should be locked with HTTP 403
    response = client.post(
        "/auth/login",
        json={
            "email": "lockout@yowon.ai",
            "password": "correctpassword123!"
        }
    )
    assert response.status_code == 403
    assert "locked" in response.json()["detail"]


def test_logout_clears_cookies(client):
    """Verifies that calling logout deletes JWT authorization cookies."""
    response = client.post("/auth/logout")
    assert response.status_code == 200
    # Cleared cookie check
    cookies = response.headers.get("set-cookie", "")
    assert "refresh_token=" in cookies
    assert "Max-Age=0" in cookies or "expires=" in cookies


def test_profile_update(client):
    """Verifies that authenticated users can update their profile information."""
    # Register & Login
    client.post(
        "/auth/register",
        json={
            "email": "profile@yowon.ai",
            "password": "profilepassword123!",
            "full_name": "Original Name"
        }
    )
    login_res = client.post(
        "/auth/login",
        json={
            "email": "profile@yowon.ai",
            "password": "profilepassword123!"
        }
    )
    access_token = login_res.json()["access_token"]
    
    # Update profile
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.put(
        "/auth/profile",
        headers=headers,
        json={
            "full_name": "Updated Name",
            "timezone": "Asia/Kolkata",
            "language": "ja"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["timezone"] == "Asia/Kolkata"
    assert data["language"] == "ja"


def test_change_password(client, db_session):
    """Verifies that authenticated users can update their password."""
    # Register & Login
    client.post(
        "/auth/register",
        json={
            "email": "passwd@yowon.ai",
            "password": "oldpassword123!",
            "full_name": "Password Changer"
        }
    )
    login_res = client.post(
        "/auth/login",
        json={
            "email": "passwd@yowon.ai",
            "password": "oldpassword123!"
        }
    )
    access_token = login_res.json()["access_token"]
    
    # Change Password
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.put(
        "/auth/change-password",
        headers=headers,
        json={
            "old_password": "oldpassword123!",
            "new_password": "newpassword123!"
        }
    )
    assert response.status_code == 200
    
    # Verify DB update
    user = db_session.query(User).filter(User.email == "passwd@yowon.ai").first()
    assert verify_password("newpassword123!", user.password_hash)
    assert not verify_password("oldpassword123!", user.password_hash)
