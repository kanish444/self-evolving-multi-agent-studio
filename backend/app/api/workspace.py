import os
import subprocess
import signal
import psutil
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.auth_dependency import get_current_user
from ..models.governance import User
from ..models.project import Project

router = APIRouter(prefix="/projects/{project_id}/workspace", tags=["Workspace"])

# Root directory for project workspaces
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKSPACES_ROOT = os.path.join(BASE_DIR, "workspaces")
os.makedirs(WORKSPACES_ROOT, exist_ok=True)

# Tracking active execution processes per project
_active_processes: Dict[str, subprocess.Popen] = {}

import re

def validate_project_id(project_id: str):
    if not re.match(r"^[A-Za-z0-9_-]+$", project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format.")

def get_project_workspace_dir(project_id: str, db: Session) -> str:
    """
    Returns absolute safe path to the project's workspace directory.
    Ensures directory exists and is strictly scoped to this project.
    """
    validate_project_id(project_id)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ws_dir = os.path.abspath(os.path.join(WORKSPACES_ROOT, project_id))
    os.makedirs(ws_dir, exist_ok=True)

    # Initialize workspace with initial README if completely empty
    if not os.listdir(ws_dir):
        readme_path = os.path.join(ws_dir, "README.md")
        reqs = project.requirements or project.description or "No requirements specified yet."
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# {project.name}\n\n**Project ID:** {project.id}\n\n## Requirements\n{reqs}\n\n---\n*Created in SE-MAESTRO AI Engineering Studio*\n")

    return ws_dir

def safe_resolve_path(workspace_dir: str, rel_path: str) -> str:
    """
    Validates and resolves a relative path against workspace_dir.
    Rejects any path traversal attempts outside workspace_dir.
    """
    clean_rel = rel_path.lstrip("/\\")
    full_path = os.path.abspath(os.path.join(workspace_dir, clean_rel))
    try:
        norm_ws = os.path.abspath(workspace_dir).lower()
        norm_full = full_path.lower()
        if not norm_full.startswith(norm_ws) or os.path.commonpath([norm_ws, norm_full]) != norm_ws:
            raise HTTPException(status_code=400, detail="Path traversal outside project workspace is forbidden.")
    except Exception:
        raise HTTPException(status_code=400, detail="Path traversal outside project workspace is forbidden.")
    return full_path

# Pydantic models
class FileItem(BaseModel):
    name: str
    path: str
    isFolder: bool
    size: Optional[int] = 0
    children: Optional[List["FileItem"]] = None

class FileContentRequest(BaseModel):
    path: str = Field(..., description="Relative path in project workspace")
    content: str = Field(..., description="File text content")

class ExecuteCommandRequest(BaseModel):
    command: str = Field(..., description="Shell command to execute in workspace")
    timeout_seconds: Optional[int] = Field(30, ge=1, le=300)

class ExecuteCommandResponse(BaseModel):
    exit_code: int
    stdout: str
    stderr: str
    timed_out: bool = False

def build_file_tree(dir_path: str, root_dir: str) -> List[FileItem]:
    """Recursively builds FileItem tree from filesystem directory."""
    items: List[FileItem] = []
    try:
        entries = sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            # Skip hidden git or cache directories from normal workspace tree
            if entry.name in [".git", "__pycache__", ".pytest_cache", "node_modules"]:
                continue
            rel_path = os.path.relpath(entry.path, root_dir).replace("\\", "/")
            if entry.is_dir():
                children = build_file_tree(entry.path, root_dir)
                items.append(FileItem(
                    name=entry.name,
                    path=rel_path,
                    isFolder=True,
                    children=children
                ))
            else:
                try:
                    size = entry.stat().st_size
                except Exception:
                    size = 0
                items.append(FileItem(
                    name=entry.name,
                    path=rel_path,
                    isFolder=False,
                    size=size
                ))
    except Exception as e:
        pass
    return items

@router.get("/files", response_model=List[FileItem])
def list_workspace_files(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Lists real filesystem files and folders for the specified project.
    Strictly isolated to project's workspace folder.
    """
    ws_dir = get_project_workspace_dir(project_id, db)
    return build_file_tree(ws_dir, ws_dir)

@router.get("/files/content")
def get_file_content(
    project_id: str,
    path: str = Query(..., description="Relative file path"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Reads genuine file content from project workspace.
    """
    ws_dir = get_project_workspace_dir(project_id, db)
    file_path = safe_resolve_path(ws_dir, path)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {"path": path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

@router.post("/files")
def save_file_content(
    project_id: str,
    payload: FileContentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Saves or creates a genuine file in the project workspace.
    Persists across page refreshes and backend restarts.
    """
    ws_dir = get_project_workspace_dir(project_id, db)
    file_path = safe_resolve_path(ws_dir, payload.path)

    try:
        parent_dir = os.path.dirname(file_path)
        os.makedirs(parent_dir, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(payload.content)
        return {"status": "saved", "path": payload.path, "bytes": len(payload.content)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {e}")

@router.delete("/files")
def delete_file(
    project_id: str,
    path: str = Query(..., description="Relative file or directory path"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Deletes a file or directory in the project workspace.
    """
    ws_dir = get_project_workspace_dir(project_id, db)
    target_path = safe_resolve_path(ws_dir, path)

    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f"Target path not found: {path}")

    try:
        if os.path.isdir(target_path):
            import shutil
            shutil.rmtree(target_path)
        else:
            os.remove(target_path)
        return {"status": "deleted", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete path: {e}")

@router.get("/diff")
def get_workspace_diff(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns modified files and unified diffs for the project workspace.
    """
    ws_dir = get_project_workspace_dir(project_id, db)
    # Check if git repository exists in workspace
    git_dir = os.path.join(ws_dir, ".git")
    if os.path.isdir(git_dir):
        try:
            status_res = subprocess.run(["git", "status", "--short"], cwd=ws_dir, capture_output=True, text=True, timeout=5)
            diff_res = subprocess.run(["git", "diff"], cwd=ws_dir, capture_output=True, text=True, timeout=5)
            return {
                "has_git": True,
                "status": status_res.stdout,
                "diff": diff_res.stdout
            }
        except Exception as e:
            pass

    return {
        "has_git": False,
        "status": "Working tree ready",
        "diff": ""
    }

@router.post("/execute", response_model=ExecuteCommandResponse)
def execute_workspace_command(
    project_id: str,
    payload: ExecuteCommandRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Executes a controlled command within the project's workspace directory.
    Enforces timeout and process termination.
    """
    ws_dir = get_project_workspace_dir(project_id, db)

    # Disallow dangerous shell patterns
    forbidden_terms = ["rm -rf /", ":(){ :|:& };:", "format", "shutdown", "del /f /s /q c:"]
    for term in forbidden_terms:
        if term in payload.command.lower():
            raise HTTPException(status_code=400, detail="Command rejected by security policy.")

    try:
        proc = subprocess.Popen(
            payload.command,
            cwd=ws_dir,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        _active_processes[project_id] = proc

        timed_out = False
        try:
            stdout, stderr = proc.communicate(timeout=payload.timeout_seconds)
        except subprocess.TimeoutExpired:
            timed_out = True
            # Terminate process tree cleanly
            try:
                parent = psutil.Process(proc.pid)
                for child in parent.children(recursive=True):
                    child.kill()
                parent.kill()
            except Exception:
                proc.kill()
            stdout, stderr = proc.communicate()

        _active_processes.pop(project_id, None)

        return ExecuteCommandResponse(
            exit_code=proc.returncode if not timed_out else -1,
            stdout=stdout or "",
            stderr=stderr or ("Execution timed out." if timed_out else ""),
            timed_out=timed_out
        )
    except Exception as e:
        _active_processes.pop(project_id, None)
        raise HTTPException(status_code=500, detail=f"Execution error: {e}")

@router.post("/stop")
def stop_workspace_command(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Terminates any active command process running for this project.
    """
    proc = _active_processes.get(project_id)
    if not proc:
        return {"status": "no_process_running"}

    try:
        parent = psutil.Process(proc.pid)
        for child in parent.children(recursive=True):
            child.kill()
        parent.kill()
        _active_processes.pop(project_id, None)
        return {"status": "stopped"}
    except Exception as e:
        _active_processes.pop(project_id, None)
        return {"status": "terminated", "note": str(e)}
