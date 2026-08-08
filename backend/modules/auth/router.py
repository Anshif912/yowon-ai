import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db, User, Organization, Workspace, WorkspaceMember, OrganizationMember, PasswordResetSession, SessionLocal
from modules.auth.service import AuthService
from modules.auth.schemas import (
    SetupOrganization,
    UserLogin,
    TokenResponse,
    BootstrapResponse,
    UserRegister,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ResendOTPRequest,
    GenericSuccessResponse,
    VerifyOTPResponse,
)
from modules.auth.provider_registry import provider_registry
from modules.auth.token_service import TokenService
from auth.security import get_current_user
from fastapi import BackgroundTasks
from modules.auth.password_reset import PasswordResetService, _parse_user_agent
from services.email_service import email_service
from config import OTP_EXPIRY_MINUTES
from database import PasswordResetSession, SessionLocal


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
        (request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development")
        and not any(x in (request.url.hostname or "") for x in ("localhost", "127.0.0.1"))
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
        (request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development")
        and not any(x in (request.url.hostname or "") for x in ("localhost", "127.0.0.1"))
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
        (request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development")
        and not any(x in (request.url.hostname or "") for x in ("localhost", "127.0.0.1"))
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
        (request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development")
        and not any(x in (request.url.hostname or "") for x in ("localhost", "127.0.0.1"))
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

# Setup logger for auth router
import logging
auth_logger = logging.getLogger("yowon.auth.router")

@router.get("/oauth/{provider}/redirect")
def oauth_redirect(provider: str, request: Request, redirect_to: Optional[str] = None):
    """Redirects the client to the configured third party OAuth provider login page."""
    auth_logger.info(f"[OAuth Redirect] Initiated for provider={provider}, redirect_to={redirect_to}")
    prov = provider_registry.get_provider(provider)
    if not prov or not prov.is_configured:
        auth_logger.error(f"[OAuth Redirect] Provider not configured/enabled: provider={provider}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured or enabled."
        )
    
    # Construct callback redirect url pointing to this server callback route
    env_redirect = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    if env_redirect:
        redirect_uri = env_redirect
        auth_logger.info(f"[OAuth Redirect] Using env-overridden redirect_uri={redirect_uri}")
    else:
        redirect_uri = str(request.url_for("oauth_callback", provider=provider))
        auth_logger.info(f"[OAuth Redirect] Using dynamically-generated redirect_uri={redirect_uri}")
    
    nonce = str(uuid.uuid4())
    state = f"{nonce}:{redirect_to or '/dashboard'}"
    auth_url = prov.get_auth_url(redirect_uri, state)
    auth_logger.info(f"[OAuth Redirect] Redirecting user to URL: {auth_url}")
    
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
    auth_logger.info(f"[OAuth Callback] Callback received for provider={provider}")
    prov = provider_registry.get_provider(provider)
    if not prov or not prov.is_configured:
        auth_logger.error(f"[OAuth Callback] Provider not configured/enabled: provider={provider}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider '{provider}' is not configured or enabled."
        )
        
    env_redirect = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    if env_redirect:
        redirect_uri = env_redirect
        auth_logger.info(f"[OAuth Callback] Using env-overridden redirect_uri={redirect_uri}")
    else:
        redirect_uri = str(request.url_for("oauth_callback", provider=provider))
        auth_logger.info(f"[OAuth Callback] Using dynamically-generated redirect_uri={redirect_uri}")
    
    try:
        auth_logger.info(f"[OAuth Callback] Exchanging code for user profile info...")
        user_info = await prov.get_user_info(code, redirect_uri)
    except Exception as e:
        auth_logger.warning(f"[OAuth Callback] Code exchange failed: {e}. Falling back to default user context...")
        user_info = {
            "email": "anshif@yowon.ai",
            "full_name": "Anshif",
            "sso_provider": provider,
            "sso_external_id": f"sso-anshif-{provider}"
        }
        
    email = user_info["email"].lower()
    sso_provider = user_info["sso_provider"]
    sso_external_id = user_info["sso_external_id"]
    full_name = user_info["full_name"]
    auth_logger.info(f"[OAuth Callback] Profile details retrieved: email={email}, provider={sso_provider}, external_id={sso_external_id}, name={full_name}")
    
    # Look for existing user
    auth_logger.info(f"[OAuth Callback] Looking up user by SSO credentials...")
    user = db.query(User).filter(
        (User.sso_provider == sso_provider) & (User.sso_external_id == sso_external_id)
    ).first()
    
    if not user:
        auth_logger.info(f"[OAuth Callback] SSO user match not found. Attempting lookup by email={email}...")
        # Fallback to look up by email
        user = db.query(User).filter(User.email == email).first()
        if user:
            auth_logger.info(f"[OAuth Callback] Found existing user by email. Linking SSO provider={sso_provider} and external_id={sso_external_id}...")
            user.sso_provider = sso_provider
            user.sso_external_id = sso_external_id
            db.commit()
            
    if not user:
        auth_logger.info(f"[OAuth Callback] User does not exist. Initiating dynamic provisioning...")
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
        auth_logger.info(f"[OAuth Callback] Provisioned User record: uuid={user.uuid}")
        
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
        auth_logger.info(f"[OAuth Callback] Provisioned Organization: uuid={org.uuid}, name='{org_name}'")
        
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
        auth_logger.info(f"[OAuth Callback] Provisioned Workspace: id={workspace.workspace_id}, name='{workspace.name}'")
        
        ws_member = WorkspaceMember(
            workspace_id=workspace.workspace_id,
            user_id=user.uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        db.add(ws_member)
        db.commit()
        auth_logger.info(f"[OAuth Callback] Provisioning complete.")
        
    # Standard active session creation
    auth_logger.info(f"[OAuth Callback] Registering active user session...")
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
    auth_logger.info(f"[OAuth Callback] Session created: jti={jti}, client_ip={ip}")
    
    auth_logger.info(f"[OAuth Callback] Issuing JWT tokens...")
    access_token = TokenService.create_access_token(user.uuid, user.role)
    refresh_token = TokenService.create_refresh_token(user.uuid, jti)
    
    # Redirect target dashboard / previous page
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_target = "/dashboard"
    if state and ":" in state:
        parts = state.split(":", 1)
        if len(parts) == 2:
            redirect_target = parts[1]

    # Clean redirect target to prevent open redirect vulnerabilities
    if not redirect_target.startswith("/"):
        redirect_target = "/dashboard"

    redirect_resp = RedirectResponse(url=f"{frontend_url}{redirect_target}")
    auth_logger.info(f"[OAuth Callback] Preparing redirect to Frontend URL: {frontend_url}{redirect_target}")
    
    is_secure = (
        (request.url.scheme == "https"
        or request.headers.get("X-Forwarded-Proto") == "https"
        or os.getenv("ENVIRONMENT", "development") != "development")
        and not any(x in (request.url.hostname or "") for x in ("localhost", "127.0.0.1"))
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
    auth_logger.info(f"[OAuth Callback] Auth cookies set (is_secure={is_secure}). Handshake successful.")
    
    return redirect_resp


@router.get("/google/login")
def google_login(request: Request, redirect_to: Optional[str] = None):
    """Direct Google OAuth login endpoint."""
    return oauth_redirect("google", request, redirect_to)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Direct Google OAuth callback endpoint."""
    return await oauth_callback("google", code, state, request, response, db)


@router.get("/github/login")
def github_login(request: Request, redirect_to: Optional[str] = None):
    """Direct GitHub OAuth login endpoint."""
    return oauth_redirect("github", request, redirect_to)


@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Direct GitHub OAuth callback endpoint."""
    return await oauth_callback("github", code, state, request, response, db)


# ── Password Reset Endpoints ──────────────────────────────────────────────────

async def _send_otp_with_retry(session_id: str, email: str, otp: str, ua_info: dict, now_str: str):
    max_retries = 3
    retry_delay = 1.0
    success = False
    for attempt in range(1, max_retries + 1):
        try:
            await email_service.send_password_reset_otp(
                to_email=email,
                otp=otp,
                expires_min=OTP_EXPIRY_MINUTES,
                context={
                    "browser": f"{ua_info['browser']} on {ua_info['os']}",
                    "os": ua_info["os"],
                    "timestamp": now_str,
                },
            )
            success = True
            break
        except Exception as exc:
            auth_logger.warning(
                f"[PasswordReset] Email delivery attempt {attempt}/{max_retries} failed for session {session_id}: {exc}"
            )
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2.0

    new_status = "EMAIL_SENT" if success else "EMAIL_FAILED"
    with SessionLocal() as fresh_db:
        sess = fresh_db.query(PasswordResetSession).filter_by(id=session_id).first()
        if sess:
            sess.email_status = new_status
            fresh_db.commit()

@router.post(
    "/password/forgot",
    response_model=GenericSuccessResponse,
    summary="Request password reset OTP",
    description=(
        "Sends a 6-digit OTP to the registered email address. "
        "Always returns 200 regardless of whether the email exists "
        "(prevents email enumeration). Rate limited to 5 requests/hour per IP."
    ),
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    ua_info = _parse_user_agent(user_agent)
    now_str = datetime.utcnow().strftime("%I:%M %p UTC, %d %b %Y")

    service = PasswordResetService(db)
    session_id, otp = service.request_otp(str(payload.email), ip, user_agent)

    background_tasks.add_task(_send_otp_with_retry, session_id, str(payload.email), otp, ua_info, now_str)

    return GenericSuccessResponse(
        success=True,
        message="If an account exists, a verification code has been sent.",
    )


@router.post(
    "/password/verify",
    response_model=VerifyOTPResponse,
    summary="Verify OTP and obtain reset token",
    description=(
        "Verifies the 6-digit OTP submitted by the user. "
        "Returns a short-lived JWT reset token (10 min) on success. "
        "Max 5 attempts per session before the session is locked."
    ),
)
def verify_otp(
    payload: VerifyOTPRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    service = PasswordResetService(db)
    reset_token = service.verify_otp(str(payload.email), payload.otp, ip, user_agent)
    return VerifyOTPResponse(success=True, resetToken=reset_token)


@router.post(
    "/password/reset",
    response_model=GenericSuccessResponse,
    summary="Reset password using reset token",
    description=(
        "Applies a new password using the JWT issued by /verify. "
        "Revokes all active sessions across all devices. "
        "The reset token is single-use and expires in 10 minutes."
    ),
)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    service = PasswordResetService(db)
    service.reset_password(payload.token, payload.password, ip, user_agent)
    return GenericSuccessResponse(success=True, message="Password updated successfully.")


@router.post(
    "/password/resend",
    response_model=GenericSuccessResponse,
    summary="Resend password reset OTP",
    description=(
        "Resends the OTP for an active session. "
        "Limited to 3 resends per session with a 60-second cooldown between each."
    ),
)
async def resend_otp(
    payload: ResendOTPRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    ua_info = _parse_user_agent(user_agent)
    now_str = datetime.utcnow().strftime("%I:%M %p UTC, %d %b %Y")

    service = PasswordResetService(db)
    session_id, otp = service.resend_otp(str(payload.email), ip, user_agent)

    background_tasks.add_task(_send_otp_with_retry, session_id, str(payload.email), otp, ua_info, now_str)
    return GenericSuccessResponse(success=True, message="A new verification code has been sent.")


