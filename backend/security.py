"""Security helpers for API intake, uploads, and safe public errors."""

from __future__ import annotations

import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

from fastapi import HTTPException, Request, UploadFile

from config import UPLOAD_DIR

MAX_REQUEST_BYTES = 60 * 1024 * 1024
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_PROJECT_NAME_CHARS = 120
PROJECT_ID_RE = re.compile(r"^[0-9a-fA-F-]{36}$")
SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")
GITHUB_OWNER_RE = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")
GITHUB_REPO_RE = re.compile(r"^[A-Za-z0-9_.-]{1,100}(?:\.git)?$")
EXECUTABLE_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".com", ".scr", ".ps1", ".sh", ".js", ".jar", ".msi",
    ".dll", ".vbs", ".wsf", ".php", ".py", ".rb", ".pl",
}
UPLOAD_RULES = {
    "pdf": {
        "extensions": {".pdf"},
        "mime_types": {"application/pdf", "application/x-pdf"},
        "magic": (b"%PDF-",),
    },
    "ppt": {
        "extensions": {".ppt", ".pptx"},
        "mime_types": {
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/octet-stream",
        },
        "magic": (b"PK\x03\x04", b"\xd0\xcf\x11\xe0"),
    },
}
RATE_LIMITS = {
    "upload": (8, 60.0),
    "evaluate": (10, 60.0),
    "github": (20, 60.0),
}
_rate_buckets: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def public_error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def client_ip(request: Request | None) -> str:
    if request is None:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64] or "unknown"
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, identity: str) -> None:
    limit, window = RATE_LIMITS.get(key, (30, 60.0))
    now = time.monotonic()
    bucket = _rate_buckets[(key, identity)]
    while bucket and now - bucket[0] > window:
        bucket.popleft()
    if len(bucket) >= limit:
        raise public_error(429, "Too many requests. Please wait before trying again.")
    bucket.append(now)


async def enforce_request_size(request: Request) -> None:
    raw = request.headers.get("content-length")
    if not raw:
        return
    try:
        size = int(raw)
    except ValueError:
        raise public_error(400, "Invalid request metadata")
    if size > MAX_REQUEST_BYTES:
        raise public_error(413, "Request is too large")


def sanitize_project_name(value: str) -> str:
    cleaned = " ".join(str(value or "").strip().split())
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", cleaned)
    if not cleaned:
        raise public_error(422, "Project name is required")
    if len(cleaned) > MAX_PROJECT_NAME_CHARS:
        raise public_error(422, f"Project name must be {MAX_PROJECT_NAME_CHARS} characters or fewer")
    return cleaned


def validate_project_id(project_id: str) -> str:
    if not PROJECT_ID_RE.match(str(project_id or "")):
        raise public_error(422, "Invalid project id")
    return project_id


def validate_github_url(url: str | None) -> str | None:
    if not url:
        return None
    value = str(url).strip()
    if len(value) > 512:
        raise public_error(422, "GitHub URL is too long")
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "http"}:
        raise public_error(422, "GitHub URL must use http(s)")
    if parsed.netloc.lower() != "github.com":
        raise public_error(422, "GitHub URL must be a github.com repository")
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if len(parts) != 2:
        raise public_error(422, "GitHub URL must point to a repository")
    owner, repo = parts
    if not GITHUB_OWNER_RE.match(owner) or not GITHUB_REPO_RE.match(repo):
        raise public_error(422, "GitHub URL contains invalid repository characters")
    return f"https://github.com/{owner}/{repo.removesuffix('.git')}"


def _safe_filename(filename: str, allowed_extensions: Iterable[str]) -> str:
    original = Path(str(filename or "")).name
    if not original or original in {".", ".."}:
        raise public_error(422, "Uploaded file must have a name")
    parts = [part.lower() for part in original.split(".") if part]
    if len(parts) < 2:
        raise public_error(422, "Uploaded file must include a valid extension")
    extensions = ["." + part for part in parts[1:]]
    if any(ext in EXECUTABLE_EXTENSIONS for ext in extensions[:-1]):
        raise public_error(422, "Executable or double-extension uploads are not allowed")
    if extensions[-1] not in allowed_extensions:
        raise public_error(422, "Uploaded file type is not allowed")
    if len(extensions) > 1 and any(ext not in allowed_extensions for ext in extensions):
        raise public_error(422, "Double-extension uploads are not allowed")
    stem = SAFE_NAME_RE.sub("_", ".".join(original.split(".")[:-1])).strip("._-") or "upload"
    return f"{stem[:80]}{extensions[-1]}"


def _resolve_upload_path(project_id: str, filename: str) -> Path:
    dest = (UPLOAD_DIR / f"{project_id}_{filename}").resolve()
    root = UPLOAD_DIR.resolve()
    if root not in dest.parents:
        raise public_error(400, "Invalid upload path")
    return dest


async def validate_and_save_upload(upload: UploadFile, project_id: str, kind: str) -> str:
    rules = UPLOAD_RULES[kind]
    safe_name = _safe_filename(upload.filename or "", rules["extensions"])
    content_type = (upload.content_type or "").split(";", 1)[0].strip().lower()
    if content_type and content_type not in rules["mime_types"]:
        raise public_error(422, f"Invalid {kind.upper()} MIME type")

    content = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise public_error(413, f"{kind.upper()} upload exceeds 50MB limit")
    if not any(content.startswith(prefix) for prefix in rules["magic"]):
        raise public_error(422, f"Uploaded {kind.upper()} file header is invalid")

    dest = _resolve_upload_path(project_id, safe_name)
    dest.write_bytes(content)
    return str(dest)


def redact_sensitive(text: str) -> str:
    value = str(text or "")
    value = re.sub(r"(?i)(api[_-]?key|token|secret|password)=?[^,\s]+", r"\1=[redacted]", value)
    value = re.sub(r"(?i)(sk-[A-Za-z0-9]{12,}|ghp_[A-Za-z0-9]{12,}|AKIA[0-9A-Z]{12,})", "[redacted]", value)
    return value[:500]
