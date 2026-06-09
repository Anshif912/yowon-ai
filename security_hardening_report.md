# YOWON AI Security Hardening Report

## Current Risk Level

Medium after hardening. The application now has stronger intake validation, request-size enforcement, upload validation, safe public errors, and basic abuse protection. Remaining risk is mostly operational: authentication, persistent distributed rate limiting, and production WAF controls are still recommended.

## High Risk Issues

- File uploads accepted user filenames and did not validate MIME type, magic bytes, double extensions, or executable disguises.
- API responses could expose internal exception details through some PDF/document paths and failure messages.
- GitHub repository URLs were not validated at upload time and could reach repository processing as malformed or non-GitHub URLs.

## Medium Risk Issues

- No lightweight per-IP throttling existed for upload and evaluation triggers.
- Request bodies were not rejected early by size before multipart processing.
- Project IDs were not consistently validated before database lookups.
- Document parser errors could include internal paths or parser exception details.

## Low Risk Issues

- Frontend upload checks relied mainly on accept attributes instead of explicit validation.
- Security headers were not set by the API.
- Security logs did not consistently classify rejected uploads or validation failures.

## Implemented Fixes

- Added request size enforcement with a 60MB request cap.
- Added per-IP in-memory throttling for uploads and evaluation triggers.
- Added project ID validation before report/status/progress/PDF database lookups.
- Added GitHub URL validation for `github.com/owner/repo` URLs at upload and extraction boundaries.
- Added safe project-name sanitization and length limits.
- Added secure upload handling:
  - safe filename generation
  - path traversal prevention
  - 50MB per-file cap
  - MIME validation
  - PDF/PPT magic-byte validation
  - executable and double-extension rejection
- Added API security headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
- Added safe catch-all exception handling for public responses.
- Removed internal PDF validation path details from API error responses.
- Sanitized PDF/PPT parser error output and extracted control characters from document text.
- Added frontend file validation for size, MIME, extension, double extension, and executable disguises.
- Added frontend GitHub URL validation for repository URLs.
- Added redaction helper for structured security logs.

## Remaining Recommendations

- Add authentication and role-based access control before exposing YOWON AI publicly.
- Replace in-memory throttling with Redis or another shared rate-limit store for multi-process deployments.
- Add CSRF protection if cookie-based authentication is introduced.
- Put the API behind a production reverse proxy or WAF with upload and request limits.
- Add retention cleanup for uploaded files, generated reports, and repository cache entries.
- Add an operational secrets scanner in CI.
- Move security events to a centralized audit log in production.
