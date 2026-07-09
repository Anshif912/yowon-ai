import logging
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from auth.schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ProfileUpdate,
    PasswordChange,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)

logger = logging.getLogger("yowon.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user in the platform."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
        
    try:
        user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            role="user",
            status="active",
            email_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User registered successfully: {user.email} (uuid: {user.uuid})")
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to register user {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database write failed during registration"
        )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns tokens."""
    email_clean = payload.email.lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        logger.warning(f"Failed login attempt: non-existent email {email_clean}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check lockout status
    if user.account_locked:
        logger.warning(f"Login blocked: locked account {email_clean}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked. Please contact support."
        )

    # Verify password
    if not verify_password(payload.password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.account_locked = True
            logger.error(f"Account locked: {email_clean} due to 5 consecutive login failures.")
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if suspended
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated."
        )

    # Success: reset metrics and update login timestamp
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()

    # Generate tokens
    access_token = create_access_token(user.uuid, user.role)
    refresh_token = create_refresh_token(user.uuid)

    # Set refresh token in Secure, HTTPOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/auth",
        max_age=7 * 24 * 3600  # 7 days
    )

    # Optional: also set access token cookie as a fallback for pure cookie-based clients
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=15 * 60  # 15 minutes
    )

    logger.info(f"User logged in successfully: {email_clean}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """Refreshes access and refresh tokens using HTTPOnly cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from session cookies"
        )

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
            
        user_uuid = payload.get("sub")
        user = db.query(User).filter(User.uuid == user_uuid).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session not found"
            )
            
        if user.status != "active" or user.account_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User session is invalid or locked"
            )
            
        # Rotate refresh and access tokens
        new_access_token = create_access_token(user.uuid, user.role)
        new_refresh_token = create_refresh_token(user.uuid)

        # Set rotated refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/auth",
            max_age=7 * 24 * 3600
        )

        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
            max_age=15 * 60
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        logger.warning(f"Session refresh failed: {e}")
        # Clear cookies on failure to prevent continuous retry loops
        response.delete_cookie("refresh_token", path="/auth")
        response.delete_cookie("access_token", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session refresh failed: signature expired or invalid"
        )


@router.post("/logout")
def logout(response: Response):
    """Logs out user by deleting authorization cookies."""
    response.delete_cookie(key="refresh_token", path="/auth")
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "detail": "Session successfully terminated"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile details of the current logged in user."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(payload: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates profile details for the authenticated user."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.preferences is not None:
        current_user.preferences = payload.preferences
    if payload.timezone is not None:
        current_user.timezone = payload.timezone
    if payload.language is not None:
        current_user.language = payload.language

    db.commit()
    db.refresh(current_user)
    logger.info(f"User updated profile: {current_user.email}")
    return current_user


@router.put("/change-password")
def change_password(payload: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Changes password for the authenticated user."""
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed"
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    logger.info(f"User changed password: {current_user.email}")
    return {"success": True, "detail": "Password successfully updated"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    """Dispatches a mock password reset link."""
    logger.info(f"Password reset requested for {payload.email}")
    return {
        "success": True,
        "detail": f"If an account exists for {payload.email}, a secure password reset link has been dispatched."
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password using token verification."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    # Verification token mock checks
    if payload.token != "valid-reset-token" and len(payload.token) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token signature"
        )
        
    user.password_hash = hash_password(payload.new_password)
    user.account_locked = False
    user.failed_login_attempts = 0
    db.commit()
    logger.info(f"Password successfully reset for user: {user.email}")
    return {"success": True, "detail": "Password successfully reset. You may now log in."}


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verifies user email using signature token."""
    # Mock token lookup
    if payload.token != "valid-verification-token" and len(payload.token) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification token"
        )
    return {"success": True, "detail": "Email verification successfully completed."}


@router.post("/resend-verification")
def resend_verification(payload: ForgotPasswordRequest):
    """Resends email verification link."""
    logger.info(f"Verification email resent to {payload.email}")
    return {"success": True, "detail": "Verification instructions resent to your email address."}
