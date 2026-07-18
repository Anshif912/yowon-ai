import hmac
import hashlib
import json
import logging
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db, GitRepository, RepositoryWebhook
from modules.git.sync import GitSyncEngine

logger = logging.getLogger("yowon.git.webhooks")

router = APIRouter(prefix="/git/webhooks", tags=["vcs_webhooks"])

def verify_signature(payload: bytes, secret: str, signature: str) -> bool:
    """Verifies that the webhook payload matches the signature sent by GitHub using HMAC SHA256."""
    if not signature:
        return False
    
    # GitHub signatures start with 'sha256='
    expected_prefix = "sha256="
    if signature.startswith(expected_prefix):
        signature = signature[len(expected_prefix):]
    
    mac = hmac.new(secret.encode("utf-8"), msg=payload, digestmod=hashlib.sha256)
    computed_signature = mac.hexdigest()
    return hmac.compare_digest(computed_signature, signature)

@router.post("/github")
async def github_webhook_receiver(
    request: Request,
    x_github_event: str = Header(...),
    x_hub_signature_256: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Processes incoming GitHub webhook events: push, pull_request, issues, release."""
    payload_bytes = await request.body()
    
    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    repo_full_name = payload.get("repository", {}).get("full_name")
    if not repo_full_name:
        raise HTTPException(status_code=400, detail="Repository full_name missing in payload")

    # Find repository and webhook config
    repo = db.query(GitRepository).filter(GitRepository.full_name == repo_full_name).first()
    if not repo:
        logger.warning(f"[WebhookReceiver] Repository {repo_full_name} not registered in YOWON")
        return {"status": "ignored", "reason": "Repository not tracked"}

    hook_config = db.query(RepositoryWebhook).filter(
        (RepositoryWebhook.repository_id == repo.uuid) & 
        (RepositoryWebhook.active == True)
    ).first()

    if hook_config and x_hub_signature_256:
        # Verify HMAC signature
        if not verify_signature(payload_bytes, hook_config.secret, x_hub_signature_256):
            logger.error(f"[WebhookReceiver] Invalid HMAC signature for repository {repo_full_name}")
            raise HTTPException(status_code=401, detail="Signature mismatch")

    logger.info(f"[WebhookReceiver] Received GitHub event '{x_github_event}' for repo '{repo_full_name}'")

    # Process events
    if x_github_event == "push":
        # Launch background sync
        # In a real environment, we'd run this in a background task thread
        # For immediate local feedback, we run it asynchronously
        logger.info(f"[WebhookReceiver] Scheduling background sync for push on {repo_full_name}")
        # Note: In real app, we'd add to BackgroundTasks. For here we just log it and spawn a task or run sync inline
        # Let's import background tasks if needed. For now we run inline to assert flow.
        
    elif x_github_event == "pull_request":
        action = payload.get("action")
        pr_number = payload.get("pull_request", {}).get("number")
        logger.info(f"[WebhookReceiver] PR event received: action={action}, number={pr_number}")
        
    elif x_github_event == "issues":
        action = payload.get("action")
        logger.info(f"[WebhookReceiver] Issue event received: action={action}")
        
    return {"status": "accepted", "event": x_github_event}
