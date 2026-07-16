import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db, User, Organization, Workspace, WorkspaceMember, OrganizationMember
from modules.auth.service import AuthService
from modules.auth.schemas import SetupOrganization, UserLogin, TokenResponse, BootstrapResponse, UserRegister
from modules.auth.provider_registry import provider_registry
from modules.auth.token_service import TokenService
from auth.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Enterprise Authentication"])

@router.get("/bootstrap", response_model=BootstrapResponse)
def bootstrap(response: Response, db: Session = Depends(get_db)):
    """Returns platform initialization status, configured SSO/OAuth providers, and settings."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    service = AuthService(db)
    return service.bootstrap()

@router.post("/setup-organization", response_model=TokenResponse)
def setup_organization(
    payload: SetupOrganization,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Executes the enterprise installation wizard to configure Organization, Workspace and Admin."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    result = service.setup_organization(payload, ip, user_agent)
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Registers a new user (Anyone can create an account), sets cookies and returns active session."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    result = service.register_user(payload, ip, user_agent)
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }

@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticates credentials, updates user session logs, and sets cookies."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    result = service.authenticate_user(payload, ip, user_agent)
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Rotates session tokens and updates device authentication mappings."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from session cookies."
        )
        
    service = AuthService(db)
    ip = request.client.host if request.client else None
    result = service.rotate_session_token(refresh_token, ip)
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Terminates session logs and invalidates auth cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        service = AuthService(db)
        service.terminate_session(refresh_token)
        
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "detail": "Session terminated successfully."}

@router.post("/logout-all")
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Forces termination of all active sessions across all devices for this user."""
    service = AuthService(db)
    service.terminate_all_sessions(current_user.uuid)
    
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "detail": "All device sessions successfully terminated."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile details of the current authenticated user."""
    return current_user

@router.get("/oauth/{provider}/redirect")
def oauth_redirect(provider: str, request: Request):
    """Redirects the client to the configured third party OAuth provider login page."""
    prov = provider_registry.get_provider(provider)
    if not prov or not prov.is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured or enabled."
        )
    
    # Construct callback redirect url pointing to this server callback route
    env_redirect = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    if env_redirect:
        redirect_uri = env_redirect
    else:
        redirect_uri = str(request.url_for("oauth_callback", provider=provider))
    
    state = str(uuid.uuid4())
    auth_url = prov.get_auth_url(redirect_uri, state)
    
    return RedirectResponse(auth_url)

@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Exchanges code for credentials, matches/provisions user, creates active session, and redirects to dashboard."""
    prov = provider_registry.get_provider(provider)
    if not prov or not prov.is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured or enabled."
        )
        
    env_redirect = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    if env_redirect:
        redirect_uri = env_redirect
    else:
        redirect_uri = str(request.url_for("oauth_callback", provider=provider))

    
    try:
        user_info = await prov.get_user_info(code, redirect_uri)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth code exchange failed: {str(e)}"
        )
        
    email = user_info["email"].lower()
    sso_provider = user_info["sso_provider"]
    sso_external_id = user_info["sso_external_id"]
    full_name = user_info["full_name"]
    
    # Look for existing user
    user = db.query(User).filter(
        (User.sso_provider == sso_provider) & (User.sso_external_id == sso_external_id)
    ).first()
    
    if not user:
        # Fallback to look up by email
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.sso_provider = sso_provider
            user.sso_external_id = sso_external_id
            db.commit()
            
    if not user:
        # Register a new user dynamically (Anyone can create an account via OAuth)
        user = User(
            uuid=str(uuid.uuid4()),
            full_name=full_name,
            email=email,
            password_hash="", # Authenticated via SSO
            role="TEAM_MEMBER",
            status="active",
            email_verified=True,
            sso_provider=sso_provider,
            sso_external_id=sso_external_id,
            provisioning_source="SSO",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.flush()
        
        # Create personal organization & workspace
        org_name = f"{full_name}'s Org"
        org = Organization(
            uuid=str(uuid.uuid4()),
            name=org_name,
            slug=(org_name.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:8])[:255],
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        db.add(org)
        db.flush()
        
        org_member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=org.uuid,
            user_id=user.uuid,
            role="owner",
            joined_at=datetime.utcnow()
        )
        db.add(org_member)
        
        workspace = Workspace(
            workspace_id=str(uuid.uuid4()),
            organization_id=org.uuid,
            name="Personal Workspace",
            description="Your personal engineering workspace.",
            type="PERSONAL",
            visibility="PRIVATE",
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        db.add(workspace)
        db.flush()
        
        ws_member = WorkspaceMember(
            workspace_id=workspace.workspace_id,
            user_id=user.uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        db.add(ws_member)
        db.commit()
        
    # Standard active session creation
    service = AuthService(db)
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    jti = str(uuid.uuid4())
    browser, os_name = service._parse_user_agent(user_agent)
    service.session_service.create_user_session(
        user_uuid=user.uuid,
        token_jti=jti,
        device_name=f"{browser} on {os_name}",
        browser=browser,
        os_name=os_name,
        ip_address=ip
    )
    
    access_token = TokenService.create_access_token(user.uuid, user.role)
    refresh_token = TokenService.create_refresh_token(user.uuid, jti)
    
    # Redirect target dashboard
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_resp = RedirectResponse(url=f"{frontend_url}/dashboard")
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development"
    )
    
    redirect_resp.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    redirect_resp.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    return redirect_resp
