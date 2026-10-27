# Update based on GitHub commit 78e27ad

This revision preserves the latest approved Login, Dashboard, Sidebar and Topbar designs. It replaces the generic approval-time scaffold with the live engine and connects the existing architect-plan/chat/approval UI through authenticated compatibility routes. The existing Editor panel layout is preserved. Its file explorer, assistant, diff view, test controls and preview controls are connected to the live API. AI Team, Tests & Fixes, standalone Preview and configuration status views use the new live execution components. The terminal accepts the explicitly supported `ls` and `test` commands; arbitrary host shell execution is disabled.

Use this archive instead of the earlier ZIP based on 1e3471e. Do not blindly overwrite unrelated local Antigravity changes; use the accompanying patch or compare in a new folder.

# SE-MAESTRO live engineering workspace

This checkout adds a real file-and-execution workflow. It replaces the active demo UI/routes with a live workspace. Legacy source modules remain in the repository but their demonstration APIs are disabled by default.

## What is implemented

- Real authenticated accounts; session restoration validates the token against the server.
- Account-owned project creation/listing with no frontend demo-project fallback.
- Architect planning and explicit project-scope approval.
- Real Gemini requests with structured output and no mock fallback.
- Generated multi-file projects persisted under `backend/workspaces/<project-id>/source/`.
- File explorer, file reading/saving, persisted execution events, agent status and follow-up changes.
- Docker-only test execution, actual exit code/output/test count and code revision evidence.
- Bounded diagnosis/fix/retest with locked tests during each correction cycle.
- Source review and blocking findings before startup.
- Actual application startup, local port, HTTP health check, preview, stop/restart.
- Runtime-log analysis and user-requested recovery.
- Evidence-linked lesson proposals, not automatic self-training.
- Cooperative cancellation at operation boundaries. A current provider call/container command can take up to its existing timeout to finish.

## Supported scope and limits

This is a first live implementation, **not a verified replacement for Antigravity or a production-ready autonomous platform**.

Supported generated applications use Python standard library or Node standard library with browser HTML/CSS/JavaScript. Generated React/Vite, package installation, arbitrary frameworks, production deployment and multi-provider routing are not implemented in this path. Data stored by a generated app in its container `/tmp` is temporary and disappears when the preview is recreated. Project source and engineering evidence persist on the host.

Agent roles are event-driven: PM and Architect plan; Developer implements; Tester writes and runs tests; Debugger fixes failures; Reviewer evaluates source; Governance applies the fixed execution/file scope; Output AI starts the app; Evolution records proposals. Incident Analyst and Incident Response run when requested. Idle does not mean broken.

The backend must run as **one worker**. In-process locks prevent duplicate runs in that worker. Distributed jobs/locks, token revocation, hostile-tenant hardening, resource quotas across all users and independent acceptance assessment remain future work. AI-written tests and AI review do not guarantee every requirement is satisfied.

Docker containers get no host credentials, read-only source/root filesystem, dropped capabilities, restricted memory/CPU/PIDs and a temporary filesystem. Tests have no network. Preview uses Docker bridge networking and publishes only to `127.0.0.1`. Use this local development workflow only; Docker is not an absolute hostile-code security boundary.

## Windows setup

Close the old frontend/backend terminals first so port 8000 does not keep serving an older checkout. Open PowerShell in the updated repository. Verify the backend /docs page contains the /projects/{project_id}/live endpoints after startup.

1. Install/start Docker Desktop with Linux containers.
2. Pull the execution images:

```powershell
docker pull python:3.12-slim
docker pull node:22-slim
```

3. Install backend dependencies:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

4. Create `backend/.env` using `.env.example`. Configure your own `GEMINI_API_KEY` and an `AI_MODEL` currently available to that account. No keys are supplied with this code. Keep `AI_PROVIDER=gemini`. Do not paste credentials into chat or project prompts.

5. Create your account. The password is entered privately:

```powershell
python scripts/create_user.py
```

Normal startup does not create/reset demo accounts. Existing records are retained. Old projects with no owner are hidden rather than automatically assigned to the next login.

6. Start the API:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

7. In another terminal at the repository root:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

8. Open `http://127.0.0.1:5173`. Sign in, create a project using its name and description, open Editor and send the description to the assistant. Answer necessary questions, review the plan, then approve the scope. Follow actual execution in Editor, AI Team, Tests & Fixes and Preview.

If Docker is not running, an image is missing, provider credentials are absent, the model is unavailable or quota is exhausted, the run stops with a blocked/failed state. It does not return simulated success.

The default database migration adds `projects.owner_id` to an existing SQLite database without deleting records. The migration helper in `main.py` is SQLite-specific; migrate other database engines explicitly before use.

## Configuration

- `LIVE_PYTHON_IMAGE`: defaults to `python:3.12-slim`.
- `LIVE_NODE_IMAGE`: defaults to `node:22-slim`.
- `MAESTRO_WORKSPACE_ROOT`: optional absolute source/evidence directory; otherwise `backend/workspaces`.
- `AUTH_SECRET_KEY`: recommended explicit private secret. If absent, a local random key is persisted in `backend/.auth-secret` and ignored by git. Changing the key invalidates previous tokens.
- `SEED_DEMO_DATA`: leave unset/false.
- `ENABLE_LEGACY_DEMOS`: leave unset/false. Enabling legacy endpoints re-exposes unverified demonstration behaviour and weaker legacy access boundaries.

Do not run the old `backend/app/seed.py` for this live workflow.

## Validation performed and remaining blockers

The regression suite `backend/live_tests/test_engine.py` uses an isolated temporary database and workspace. It checks account ownership, authentication, persistence, path/symlink/secret protection, duplicate-operation blocking, fail-closed provider behaviour, rejection of zero tests and correction-cycle integrity.

The correction-cycle test uses **test-only provider and container doubles**, but writes actual files and executes an actual Python unittest process. It is not evidence of a live Gemini request or real Docker isolation.

Frontend TypeScript/Vite production build is checked separately.

A live Gemini-generated application and actual Docker startup cannot be certified in an environment without a configured provider and Docker engine. Complete that verification on your machine using the setup above before calling the system fully working.

### This update's observed checks

- 29 live-workspace regression tests passed, including startup-failure recovery routing.
- Frontend TypeScript check and Vite production build passed.
- Python compile checks passed for the new engine/API/account setup code.
- No live provider credentials or Docker engine were available in the editing environment. Real Gemini-generated application startup was therefore not verified.
- Browser interaction and visual screenshots were not verified: the browser binary download was unavailable. Frontend build success is not browser verification.
- Historical demonstration test suites have not been certified against the new active API; use the explicitly documented live regression suite for this update. No assertion was removed to make the new suite pass.
