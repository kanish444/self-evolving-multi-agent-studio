"""Authenticated API for the actual engineering workspace."""
import asyncio
import json
import time
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .auth import get_current_user
from ..core.database import get_db
from ..models.project import Project
from ..live import engine

router = APIRouter(prefix="/projects/{project_id}/live", tags=["live-engineering"])


def owned(project_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found in your account")
    return project


class Message(BaseModel):
    message: str = Field(min_length=1, max_length=12000)


class FileContent(BaseModel):
    path: str
    content: str = Field(max_length=100000)


def idle(project_id):
    if project_id in engine.BUSY:
        raise HTTPException(409, "Wait for the active project operation to finish")


def acquire(project_id):
    try:
        engine.reserve(project_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))


@router.get("")
def state(project: Project = Depends(owned)):
    result = engine.load(project.id)
    # Recover stale RUNNING status if backend was interrupted and project is not in BUSY
    if result.get("status") == "RUNNING" and project.id not in engine.BUSY:
        if time.time() - result.get("updated_at", 0) > 45:
            result.update(status="BLOCKED", error="Operation was interrupted; review files and submit a new request.")
            for role, rstatus in result.get("agents", {}).items():
                if rstatus == "RUNNING":
                    result["agents"][role] = "BLOCKED"
            engine.save(project.id, result)
    result["files"] = list(engine.snapshot(project.id))
    return result


from ..live import engine, assistant


@router.post("/chat")
async def chat(body: Message, background: BackgroundTasks, project: Project = Depends(owned)):
    state = engine.load(project.id)
    response_data, bg_action = await assistant.process_user_message(
        project_id=project.id,
        project_name=project.name,
        user_message=body.message,
        state=state
    )
    if response_data.get("status") == "CONFLICT":
        raise HTTPException(409, response_data.get("reply", "Wait for the active project operation to finish"))
    if bg_action:
        pid, req_text, mode = bg_action
        if mode == "tests":
            async def run_tests_bg():
                try:
                    runtime = state.get("plan", {}).get("runtime", "python")
                    res = await asyncio.to_thread(engine.run_tests, pid, runtime)
                    st = engine.load(pid)
                    st["test_result"] = res
                    engine.event(pid, st, "TESTER", "COMPLETED" if res["passed"] else "FAILED", "Observed test runner result", res)
                    st["status"] = "READY"
                    engine.save(pid, st)
                finally:
                    engine.BUSY.discard(pid)
            background.add_task(run_tests_bg)
        elif mode == "start_preview":
            async def start_preview_bg():
                try:
                    st = engine.load(pid)
                    await asyncio.to_thread(engine.start_preview, pid, st)
                    st["status"] = "READY"
                    engine.save(pid, st)
                except Exception as exc:
                    st = engine.load(pid)
                    st["error"] = str(exc)
                    engine.save(pid, st)
                finally:
                    engine.BUSY.discard(pid)
            background.add_task(start_preview_bg)
        elif mode == "stop_preview":
            async def stop_preview_bg():
                st = engine.load(pid)
                await asyncio.to_thread(engine.stop_preview, st)
                engine.save(pid, st)
            background.add_task(stop_preview_bg)
        else:
            background.add_task(engine.execute, pid, req_text, mode)

    return {
        "status": response_data.get("status", "READY"),
        "intent": response_data.get("intent"),
        "message": response_data.get("reply"),
        "reply": response_data.get("reply"),
        "read_only": response_data.get("read_only", False)
    }


@router.post("/approve")
def approve(background: BackgroundTasks, project: Project = Depends(owned), db: Session = Depends(get_db)):
    state = engine.load(project.id)
    idle(project.id)
    if not state.get("plan") or state["plan"].get("questions"):
        raise HTTPException(409, "Resolve the Architect's questions before approving")
    if state["status"] not in {"AWAITING_APPROVAL", "BLOCKED", "FAILED"}:
        raise HTTPException(409, "No pending plan to approve")
    acquire(project.id)
    (engine.directory(project.id) / "cancel.requested").unlink(missing_ok=True)
    state.update(approved=True, status="RUNNING")
    engine.save(project.id, state)
    # Ensure project record in DB records granted permissions and status
    project.permissions_granted = json.dumps(["FILES_READ_WRITE", "RUN_CODE_TESTS"])
    project.status = "BUILDING"
    db.commit()
    background.add_task(engine.execute, project.id, "Implement the approved plan.", "build")
    return {"status": "RUNNING"}


@router.post("/cancel")
def cancel(project: Project = Depends(owned)):
    if project.id not in engine.BUSY:
        raise HTTPException(409, "No active operation to cancel")
    (engine.directory(project.id) / "cancel.requested").touch()
    return {"message": "Cancellation requested. The current bounded operation will finish before the next checkpoint."}


@router.get("/file")
def read_file(path: str, project: Project = Depends(owned)):
    try:
        target = engine.source_path(project.id, path)
        if not target.is_file():
            raise HTTPException(404, "File not found")
        if target.stat().st_size > 100000:
            raise HTTPException(413, "File is too large")
        return {"path": path, "content": target.read_text(encoding="utf-8")}
    except (ValueError, UnicodeError) as exc:
        raise HTTPException(400, str(exc))


@router.get("/diff")
def diff(project: Project = Depends(owned)):
    import difflib
    import json
    baseline = engine.directory(project.id) / "previous_source.json"
    before = json.loads(baseline.read_text()) if baseline.exists() else {}
    after = engine.snapshot(project.id)
    changes = []
    for path in sorted(before.keys() | after.keys()):
        changes.extend(difflib.unified_diff(before.get(path, '').splitlines(keepends=True),
                                           after.get(path, '').splitlines(keepends=True),
                                           fromfile='before/' + path, tofile='after/' + path))
    return {"has_git": False, "status": "Snapshot comparison", "diff": ''.join(changes)}


@router.post("/tests")
async def tests(project: Project = Depends(owned)):
    idle(project.id)
    state = engine.load(project.id)
    if not state.get('approved') or not state.get('plan'):
        raise HTTPException(409, 'Approve an architecture and execution scope first')
    acquire(project.id)
    try:
        engine.event(project.id, state, 'TESTER', 'RUNNING', 'User requested a real test run')
        result = await asyncio.to_thread(engine.run_tests, project.id, state['plan']['runtime'])
        state['test_result'] = result
        engine.event(project.id, state, 'TESTER', 'COMPLETED' if result['passed'] else 'FAILED', 'Observed test runner result', result)
        return result
    except engine.Blocked as exc:
        engine.event(project.id, state, 'TESTER', 'BLOCKED', str(exc))
        raise HTTPException(503, str(exc))
    finally:
        engine.BUSY.discard(project.id)


@router.get('/preview/status')
async def preview_status(project: Project = Depends(owned)):
    state = engine.load(project.id)
    preview = state.get('preview')
    result = {'status': 'NOT_STARTED', 'port': None, 'url': None, 'logs': [], 'uptime_seconds': 0, 'error': None}
    if not preview:
        return result
    try:
        inspection = await asyncio.to_thread(engine.docker, ['inspect', '--format', '{{.State.Running}}', preview['container']], 5)
        logs = await asyncio.to_thread(engine.docker, ['logs', '--tail', '50', preview['container']], 5)
        result['logs'] = logs['output'].splitlines()
        if inspection['exit_code'] == 0 and inspection['output'].strip() == 'true' and preview.get('port'):
            result.update(status='RUNNING', port=preview['port'], url=f"http://127.0.0.1:{preview['port']}")
        else:
            result.update(status='FAILED', error='Application container is not running')
    except engine.Blocked as exc:
        result.update(status='FAILED', error=str(exc))
    return result


@router.put("/file")
def save_file(body: FileContent, project: Project = Depends(owned)):
    acquire(project.id)
    try:
        engine.write_files(project.id, [engine.SourceFile(**body.model_dump())])
        state = engine.load(project.id)
        state.update(status="EDITED", test_result=None)
        engine.save(project.id, state)
        return {"saved": True, "code_version": engine.revision(project.id)}
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    finally:
        engine.BUSY.discard(project.id)


@router.post("/preview/stop")
def stop(project: Project = Depends(owned)):
    idle(project.id)
    state = engine.load(project.id)
    try:
        engine.stop_preview(state)
        engine.save(project.id, state)
    except engine.Blocked as exc:
        raise HTTPException(503, str(exc))
    return {"stopped": True}


@router.post("/preview/restart")
async def restart(project: Project = Depends(owned)):
    idle(project.id)
    state = engine.load(project.id)
    evidence = state.get("test_result") or {}
    if not evidence.get("passed") or evidence.get("code_version") != engine.revision(project.id):
        raise HTTPException(409, "Current files need a passing test run before startup")
    acquire(project.id)
    try:
        engine.event(project.id, state, "INCIDENT_RESPONSE", "RUNNING", "User requested local application restart")
        preview = await asyncio.to_thread(engine.start_preview, project.id, state)
        engine.event(project.id, state, "INCIDENT_RESPONSE", "COMPLETED", "Restart completed and HTTP health verified", preview)
        return preview
    except (engine.Blocked, ValueError) as exc:
        engine.event(project.id, state, "INCIDENT_RESPONSE", "FAILED", str(exc))
        raise HTTPException(503, str(exc))
    finally:
        engine.BUSY.discard(project.id)


@router.post("/incident")
async def incident(project: Project = Depends(owned)):
    idle(project.id)
    state = engine.load(project.id)
    preview = state.get("preview")
    if not preview:
        raise HTTPException(409, "No application runtime to inspect")
    acquire(project.id)
    try:
        logs = await asyncio.to_thread(engine.docker, ["logs", "--tail", "100", preview["container"]], 10)
        inspect = await asyncio.to_thread(engine.docker, ["inspect", "--format", "{{.State.Status}}", preview["container"]], 10)
        engine.event(project.id, state, "INCIDENT_ANALYST", "RUNNING", "Inspecting actual container state and logs")
        report = await engine.ask("INCIDENT_ANALYST", "Analyze the observed runtime state and logs. Recommend recovery without executing it.",
                                  {"logs": logs, "runtime": inspect}, engine.Finding)
        engine.event(project.id, state, "INCIDENT_ANALYST", "COMPLETED", report.summary, report.model_dump())
        return report
    except engine.Blocked as exc:
        engine.event(project.id, state, "INCIDENT_ANALYST", "BLOCKED", str(exc))
        raise HTTPException(503, str(exc))
    finally:
        engine.BUSY.discard(project.id)


@router.get("/configuration")
async def configuration(project: Project = Depends(owned)):
    from ..core.config import settings
    import shutil
    from ..ai.providers.gemini import GeminiProvider
    provider_health = await GeminiProvider(settings.GEMINI_API_KEY, settings.AI_MODEL).health_check()
    try:
        docker_health = await asyncio.to_thread(engine.docker, ["info", "--format", "{{.ServerVersion}}"], 10)
        docker_health = {"ready": docker_health["exit_code"] == 0, "message": docker_health["output"][:500]}
    except engine.Blocked as exc:
        docker_health = {"ready": False, "message": str(exc)}
    return {"provider": settings.AI_PROVIDER, "model": settings.AI_MODEL,
            "provider_configured": bool(settings.GEMINI_API_KEY and settings.AI_MODEL), "docker_installed": bool(shutil.which("docker")),
            "provider_health": provider_health, "docker_health": docker_health,
            "runtimes": ["python-standard-library", "node-standard-library"],
            "note": "Docker daemon and image availability are checked before execution. No host fallback."}
