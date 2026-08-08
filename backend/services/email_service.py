"""
services/email_service.py — Email delivery service for YOWON AI.

Supports Resend (https://resend.com) as the email transport.
In development mode (EMAIL_DEV_MODE=true), OTPs are printed to the
console instead of being sent — the full flow is testable without
a real Resend API key.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import httpx

from config import EMAIL_DEV_MODE, RESEND_API_KEY, RESEND_FROM_EMAIL

logger = logging.getLogger("yowon.email")

_TEMPLATE_PATH = Path(__file__).parent.parent / "templates" / "email" / "password_reset.html"


def _load_template() -> str:
    """Load the HTML email template from disk."""
    try:
        return _TEMPLATE_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning("[Email] password_reset.html template not found — using plain text fallback.")
        return ""


def _render_template(
    otp: str,
    expires_min: int,
    browser: str = "Unknown Browser",
    os_name: str = "Unknown OS",
    timestamp: str = "",
) -> str:
    """Substitute placeholders in the HTML template."""
    html = _load_template()
    if not html:
        return (
            f"<p>Your YOWON AI password reset code is: <strong>{otp}</strong></p>"
            f"<p>Valid for {expires_min} minutes.</p>"
        )
    # Replace individual digit placeholders for styled display
    padded = otp.zfill(6)
    for i, digit in enumerate(padded, start=1):
        html = html.replace(f"{{{{D{i}}}}}", digit)
    return (
        html
        .replace("{{OTP}}", otp)
        .replace("{{EXPIRES_MIN}}", str(expires_min))
        .replace("{{BROWSER}}", browser)
        .replace("{{OS}}", os_name)
        .replace("{{TIMESTAMP}}", timestamp)
    )


class EmailService:
    """Thin email delivery wrapper around the Resend REST API."""

    async def send_password_reset_otp(
        self,
        to_email: str,
        otp: str,
        expires_min: int,
        context: Optional[dict] = None,
    ) -> None:
        """
        Send a password reset OTP email.

        In EMAIL_DEV_MODE the OTP is printed to the server console.
        In production, the OTP is sent via the Resend REST API.

        Args:
            to_email: Recipient email address.
            otp: The 6-digit OTP (plain text — hashed version stays in DB).
            expires_min: Expiry duration in minutes shown in the email.
            context: Optional dict with keys: browser, os, timestamp.
        """
        ctx = context or {}
        browser = ctx.get("browser", "Unknown Browser")
        os_name = ctx.get("os", "Unknown OS")
        timestamp = ctx.get("timestamp", "")

        if EMAIL_DEV_MODE:
            logger.info(
                "\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"🔐  [DEV MODE] Password Reset OTP\n"
                f"    To:      {to_email}\n"
                f"    OTP:     {otp}\n"
                f"    Expires: {expires_min} minutes\n"
                f"    Browser: {browser} on {os_name}\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )
            return

        if not RESEND_API_KEY:
            logger.error(
                "[Email] RESEND_API_KEY is not set and EMAIL_DEV_MODE is false. "
                "Email will not be delivered."
            )
            raise RuntimeError("Email service is not configured. Set RESEND_API_KEY.")

        html_body = _render_template(otp, expires_min, browser, os_name, timestamp)

        payload = {
            "from": f"YOWON AI Security <{RESEND_FROM_EMAIL}>",
            "to": [to_email],
            "subject": "Your YOWON AI Password Reset Code",
            "html": html_body,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code not in (200, 201):
            logger.error(
                f"[Email] Resend API error {response.status_code}: {response.text[:200]}"
            )
            raise RuntimeError(f"Email delivery failed with status {response.status_code}")

        logger.info(f"[Email] OTP email delivered to {to_email} via Resend.")


# Singleton for use across the application
email_service = EmailService()
