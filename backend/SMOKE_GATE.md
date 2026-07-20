# Production Smoke Gate (Phase 1)

This document explains how the production smoke suite works, which secrets it needs, and how tagged write checks are handled.

## What runs

Workflow: `.github/workflows/prod_smoke.yml`  
Runner script: `backend/prod_smoke.py`  
Matrix reference: `backend/smoke_matrix.phase1.json`

Checks covered:
- Admin login surfaces (`/admin/`, `admin/mls/property`, `admin/vlog/vlogpost`, and add pages)
- Auth flow (`/api/auth/login/`, `/api/auth/token/refresh/`, `/api/auth/profile/`)
- Core MLS read routes (`/api/mls/properties/`, filter, property-types, map-aggregates)
- Inquiry write route (`/api/mls/inquiries/`) with tagged payload

## Required GitHub configuration

### Secrets
- `SMOKE_TEST_EMAIL`
- `SMOKE_TEST_PASSWORD`

### Variables
- `SMOKE_BASE_URL` (optional; defaults to `http://localhost:8000`)

## Logging and transparency

Each check emits JSON diagnostics to workflow logs:
- check name
- method/path
- status code
- latency
- response snippet
- explicit assertion failures

## Write-check cleanup policy (Phase 1)

Phase 1 uses **tag-and-audit** cleanup:
- Inquiry records are created with a unique marker (timestamp in `email`, `message`, and `page_url`).
- The script logs the created inquiry ID and tag.
- No hard delete is performed during smoke execution.

Reason:
- There is currently no dedicated authenticated delete endpoint for smoke artifacts.

Operational expectation:
- Purge tagged smoke records periodically with a management command or admin cleanup workflow.
- If immediate deletion is required later, add a privileged cleanup endpoint and switch smoke policy from `tag_and_audit` to `create_and_delete`.
