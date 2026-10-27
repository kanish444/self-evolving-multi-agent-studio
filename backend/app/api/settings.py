import os
import httpx
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db
from ..core.security import hash_password
from ..core.auth_dependency import get_current_user, require_permission
from ..models.governance import User, UserRole, Role, RolePermission
from ..models.project import Project
from ..models.task import Task
from ..models.log import Log
from ..models.test_result import TestResult
from ..models.iteration import Iteration
from ..models.autonomous import DevelopmentIteration, ArtifactVersion

router = APIRouter(prefix="/settings", tags=["Settings"])

# Pydantic models
class AIConfigResponse(BaseModel):
    provider: str
    model: str
    is_api_key_configured: bool
    temperature: float
    max_tokens: int
    timeout_seconds: float
    supported_models: List[str]

class AIConfigUpdateRequest(BaseModel):
    provider: Optional[str] = "gemini"
    model: Optional[str] = "gemini-1.5-flash"
    api_key: Optional[str] = None
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 4096
    timeout_seconds: Optional[float] = 30.0

class ExecutionLimitsResponse(BaseModel):
    command_timeout_seconds: int = 30
    sandbox_timeout_seconds: int = 60
    max_debug_cycles: int = 3
    max_agent_retries: int = 3
    max_file_size_bytes: int = 5000000

class ExecutionLimitsUpdateRequest(BaseModel):
    command_timeout_seconds: Optional[int] = 30
    sandbox_timeout_seconds: Optional[int] = 60
    max_debug_cycles: Optional[int] = 3
    max_agent_retries: Optional[int] = 3

class DemoStatusResponse(BaseModel):
    has_demo_data: bool
    suspected_demo_projects: List[Dict[str, str]]
    message: str

class UserCreateRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role_id: str = "DEVELOPER"

class UserItemResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool

# In-memory execution limits (persisted to runtime settings)
_execution_limits = {
    "command_timeout_seconds": 30,
    "sandbox_timeout_seconds": 60,
    "max_debug_cycles": 3,
    "max_agent_retries": 3,
    "max_file_size_bytes": 5000000
}

@router.get("/ai-config", response_model=AIConfigResponse)
def get_ai_config(user: User = Depends(get_current_user)):
    """
    Returns AI provider configuration status without leaking API key.
    """
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    supported = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]
    return AIConfigResponse(
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        is_api_key_configured=has_key,
        temperature=settings.AI_TEMPERATURE,
        max_tokens=settings.AI_MAX_TOKENS,
        timeout_seconds=settings.AI_TIMEOUT,
        supported_models=supported
    )

@router.post("/ai-config")
def update_ai_config(
    payload: AIConfigUpdateRequest,
    user: User = Depends(require_permission("MODIFY_CONFIGURATION"))
):
    """
    Updates AI provider configuration. Updates environment variables and backend .env.
    """
    if payload.provider:
        settings.AI_PROVIDER = payload.provider
    if payload.model:
        settings.AI_MODEL = payload.model
    if payload.api_key is not None:
        clean_key = payload.api_key.strip()
        settings.GEMINI_API_KEY = clean_key
        # Update backend .env file safely
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        try:
            lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            
            key_written = False
            new_lines = []
            for line in lines:
                if line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
                    key_written = True
                elif line.startswith("AI_MODEL=") and payload.model:
                    new_lines.append(f"AI_MODEL={payload.model}\n")
                else:
                    new_lines.append(line)
            if not key_written:
                new_lines.append(f"GEMINI_API_KEY={clean_key}\n")

            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            pass

    if payload.temperature is not None:
        settings.AI_TEMPERATURE = payload.temperature
    if payload.max_tokens is not None:
        settings.AI_MAX_TOKENS = payload.max_tokens
    if payload.timeout_seconds is not None:
        settings.AI_TIMEOUT = payload.timeout_seconds

    return {
        "status": "updated",
        "provider": settings.AI_PROVIDER,
        "model": settings.AI_MODEL,
        "is_api_key_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    }

@router.post("/ai-test")
async def test_ai_connection(user: User = Depends(get_current_user)):
    """
    Directly tests live connectivity with the configured AI provider.
    Returns real status and actual error message on failure.
    """
    if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI Provider API Key is not configured. Please enter a valid Gemini API key."
        )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    test_payload = {
        "contents": [{"parts": [{"text": "Reply with 'CONNECTED' if you receive this message."}]}],
        "generationConfig": {"maxOutputTokens": 10}
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=test_payload, timeout=10.0)
        if resp.status_code == 200:
            return {"status": "ok", "message": f"Successfully connected to Gemini API ({settings.AI_MODEL})."}
        else:
            err_detail = resp.text
            try:
                err_json = resp.json()
                err_detail = err_json.get("error", {}).get("message", err_detail)
            except Exception:
                pass
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Gemini API returned error ({resp.status_code}): {err_detail}"
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to reach Gemini endpoint: {e}")

@router.get("/execution-limits", response_model=ExecutionLimitsResponse)
def get_execution_limits(user: User = Depends(get_current_user)):
    """Returns execution boundaries and quotas."""
    return ExecutionLimitsResponse(**_execution_limits)

@router.post("/execution-limits")
def update_execution_limits(
    payload: ExecutionLimitsUpdateRequest,
    user: User = Depends(require_permission("MODIFY_CONFIGURATION"))
):
    """Updates runtime execution limits."""
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            _execution_limits[k] = v
    return {"status": "updated", "limits": _execution_limits}

@router.get("/demo-status", response_model=DemoStatusResponse)
def check_demo_data_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Identifies suspected demo projects (P001, P002, P003, P004) without modifying data.
    """
    demo_ids = ["P001", "P002", "P003", "P004"]
    demo_projects = db.query(Project).filter(Project.id.in_(demo_ids)).all()
    found = [{"id": p.id, "name": p.name, "description": p.description or ""} for p in demo_projects]

    return DemoStatusResponse(
        has_demo_data=len(found) > 0,
        suspected_demo_projects=found,
        message=f"Found {len(found)} suspected demo project(s). Use Cleanup action to remove them explicitly." if found else "No demo projects detected."
    )

@router.post("/cleanup-demo")
def cleanup_demo_data(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("MANAGE_POLICY"))
):
    """
    Explicit user-initiated cleanup of seeded demo projects (P001 to P004).
    Leaves real user-created projects untouched.
    """
    demo_ids = ["P001", "P002", "P003", "P004"]
    projects = db.query(Project).filter(Project.id.in_(demo_ids)).all()
    deleted_names = [p.name for p in projects]

    # Delete related records
    import shutil
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ws_root = os.path.join(base_dir, "workspaces")

    for pid in demo_ids:
        db.query(Task).filter(Task.project_id == pid).delete(synchronize_session=False)
        db.query(Iteration).filter(Iteration.project_id == pid).delete(synchronize_session=False)
        db.query(DevelopmentIteration).filter(DevelopmentIteration.project_id == pid).delete(synchronize_session=False)
        db.query(TestResult).filter(TestResult.project_id == pid).delete(synchronize_session=False)
        db.query(Log).filter(Log.project_id == pid).delete(synchronize_session=False)
        # Delete workspace folder
        demo_ws = os.path.join(ws_root, pid)
        if os.path.isdir(demo_ws):
            try:
                shutil.rmtree(demo_ws)
            except Exception:
                pass

    for p in projects:
        db.delete(p)
    db.commit()

    return {
        "status": "cleaned",
        "deleted_count": len(deleted_names),
        "deleted_projects": deleted_names,
        "message": f"Successfully removed {len(deleted_names)} demo projects and cleaned workspace environments."
    }

@router.get("/users", response_model=List[UserItemResponse])
def list_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("MANAGE_USERS"))
):
    """Lists studio accounts and their assigned RBAC roles."""
    users = db.query(User).all()
    res = []
    for u in users:
        ur = db.query(UserRole).filter(UserRole.user_id == u.id).first()
        res.append(UserItemResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=ur.role_id if ur else "VIEWER",
            is_active=u.is_active
        ))
    return res

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("MANAGE_USERS"))
):
    """Creates a new user account with secure password hash and assigned role."""
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    user_id = f"user-{payload.username.lower()}"
    p_hash = hash_password(payload.password)
    new_user = User(
        id=user_id,
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=p_hash,
        is_active=True
    )
    db.add(new_user)
    db.add(UserRole(user_id=user_id, role_id=payload.role_id))
    db.commit()
    return {"status": "created", "user_id": user_id, "username": payload.username}
