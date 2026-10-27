import os
import re
import sys
import time
import socket
import psutil
import subprocess
import threading
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.auth_dependency import get_optional_current_user
from ..models.project import Project
from ..models.governance import User

router = APIRouter(prefix="/projects/{project_id}/preview", tags=["Preview"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKSPACES_ROOT = os.path.join(BASE_DIR, "workspaces")

def validate_project_id(project_id: str):
    if not project_id or not re.match(r"^[a-zA-Z0-9_\-]+$", project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID: must be alphanumeric or hyphen/underscore only"
        )

class PreviewServer:
    def __init__(self, project_id: str, port: int, proc: subprocess.Popen, entrypoint: str):
        self.project_id = project_id
        self.port = port
        self.proc = proc
        self.entrypoint = entrypoint
        self.status = "STARTING"
        self.logs: List[str] = []
        self.start_time = time.time()
        self.error_message: Optional[str] = None

# Store running preview servers in-memory
_running_previews: Dict[str, PreviewServer] = {}

def find_free_port(start_port: int = 8100) -> int:
    """Finds an available TCP port on localhost."""
    for port in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return 8199

def reader_thread(server: PreviewServer):
    """Captures stdout and stderr lines from the running preview server."""
    try:
        for line in iter(server.proc.stdout.readline, ''):
            if not line:
                break
            server.logs.append(line.rstrip())
            if len(server.logs) > 300:
                server.logs.pop(0)
    except Exception:
        pass

@router.get("/status")
def get_preview_status(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns live preview server status, URL, logs, and uptime.
    """
    validate_project_id(project_id)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    server = _running_previews.get(project_id)
    if not server:
        return {
            "status": "NOT_STARTED",
            "port": None,
            "url": None,
            "logs": [],
            "uptime_seconds": 0,
            "error": None
        }

    # Check if process died
    poll_code = server.proc.poll()
    if poll_code is not None:
        server.status = "FAILED" if poll_code != 0 else "STOPPED"
        if poll_code != 0 and not server.error_message:
            server.error_message = f"Process exited unexpectedly with code {poll_code}"

    return {
        "status": server.status,
        "port": server.port,
        "url": f"http://127.0.0.1:{server.port}" if server.status == "RUNNING" else None,
        "logs": server.logs[-50:],
        "uptime_seconds": int(time.time() - server.start_time) if server.status == "RUNNING" else 0,
        "error": server.error_message
    }

@router.post("/start")
def start_preview(
    project_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Launches the real project application inside its workspace.
    Verifies readiness before marking as RUNNING.
    """
    validate_project_id(project_id)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ws_dir = os.path.abspath(os.path.join(WORKSPACES_ROOT, project_id))
    os.makedirs(ws_dir, exist_ok=True)

    # If already running, return existing
    existing = _running_previews.get(project_id)
    if existing and existing.proc.poll() is None:
        return {
            "status": existing.status,
            "port": existing.port,
            "url": f"http://127.0.0.1:{existing.port}",
            "message": "Preview server already active."
        }

    # Clean up any dead process entry
    if existing:
        _stop_server(existing)
        _running_previews.pop(project_id, None)

    port = find_free_port(8100)

    # Determine command based on workspace files
    # 1. If index.html exists, start HTTP server
    # 2. If app.py or main.py exists, start python app
    # 3. Fallback: serve workspace directory directly via http.server
    cmd = [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"]
    entrypoint = "http.server"

    if os.path.exists(os.path.join(ws_dir, "dist", "index.html")):
        cmd = [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", "dist"]
        entrypoint = "dist/index.html"
    elif os.path.exists(os.path.join(ws_dir, "index.html")):
        entrypoint = "index.html"
    elif os.path.exists(os.path.join(ws_dir, "server.py")):
        cmd = [sys.executable, "server.py"]
        entrypoint = "server.py"

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=ws_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start preview process: {e}")

    server = PreviewServer(project_id=project_id, port=port, proc=proc, entrypoint=entrypoint)
    _running_previews[project_id] = server

    t = threading.Thread(target=reader_thread, args=(server,), daemon=True)
    t.start()

    # Poll readiness for up to 3 seconds
    ready = False
    start_wait = time.time()
    while time.time() - start_wait < 3.0:
        if proc.poll() is not None:
            server.status = "FAILED"
            server.error_message = f"Process terminated immediately with code {proc.returncode}"
            break
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) == 0:
                ready = True
                break
        time.sleep(0.2)

    if ready:
        server.status = "RUNNING"
        project.status = "RUNNING"
        db.commit()
        return {
            "status": "RUNNING",
            "port": port,
            "url": f"http://127.0.0.1:{port}",
            "message": f"Application running on port {port}"
        }
    else:
        if server.status != "FAILED":
            server.status = "FAILED"
            server.error_message = "Server started but did not respond to port connectivity check."
        return {
            "status": server.status,
            "port": port,
            "url": None,
            "message": server.error_message or "Preview failed readiness verification."
        }

def _stop_server(server: PreviewServer):
    """Kills process and all its children cleanly."""
    try:
        parent = psutil.Process(server.proc.pid)
        for child in parent.children(recursive=True):
            child.kill()
        parent.kill()
    except Exception:
        try:
            server.proc.kill()
        except Exception:
            pass
    server.status = "STOPPED"

@router.post("/stop")
def stop_preview(
    project_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Terminates the project application process tree cleanly.
    """
    validate_project_id(project_id)
    server = _running_previews.get(project_id)
    if not server:
        return {"status": "STOPPED", "message": "No server was running."}

    _stop_server(server)
    _running_previews.pop(project_id, None)

    project = db.query(Project).filter(Project.id == project_id).first()
    if project and project.status == "RUNNING":
        project.status = "READY"
        db.commit()

    return {"status": "STOPPED", "message": "Preview server stopped cleanly."}

@router.post("/restart")
def restart_preview(
    project_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """Restarts the preview application."""
    stop_preview(project_id, db, user)
    time.sleep(0.5)
    return start_preview(project_id, db, user)
