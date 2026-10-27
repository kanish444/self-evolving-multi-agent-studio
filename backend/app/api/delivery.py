import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.project import Project
from ..models.delivery import Release, Deployment, DeploymentStage, DeploymentApproval, EnvironmentConfig
from ..models.autonomous import ArtifactVersion
from ..delivery.pipeline import DeliveryPipeline
from ..delivery.environment_manager import EnvironmentManager
from ..delivery.rollback_manager import RollbackManager

router = APIRouter(tags=["delivery"])

# Request Schemas
class ReleaseCreateRequest(BaseModel):
    project_id: str
    version: str
    environment: str  # DEVELOPMENT, STAGING, PRODUCTION
    created_by: str
    simulate_health_failure: Optional[bool] = False
    files: Optional[Dict[str, str]] = None

class ApprovalSubmitRequest(BaseModel):
    approved: bool
    comments: str
    approved_by: str
    simulate_health_failure: Optional[bool] = False

# API Routes
@router.get("/delivery/environments/{project_id}")
def read_project_environments(project_id: str, db: Session = Depends(get_db)):
    """
    Retrieves or initializes Development, Staging, and Production configs for a project.
    """
    envs = []
    for name in ["DEVELOPMENT", "STAGING", "PRODUCTION"]:
        env = EnvironmentManager.get_or_create_env(project_id, name, db)
        envs.append({
            "id": env.id,
            "environment_name": env.environment_name,
            "base_url": env.base_url,
            "runtime_config": json.loads(env.runtime_config) if env.runtime_config else {},
            "deployment_policy": json.loads(env.deployment_policy) if env.deployment_policy else {},
            "health_check_config": json.loads(env.health_check_config) if env.health_check_config else {}
        })
    return envs

@router.get("/delivery/releases/{project_id}")
def read_project_releases(project_id: str, db: Session = Depends(get_db)):
    """
    Lists all releases for a project.
    """
    releases = db.query(Release).filter(Release.project_id == project_id).order_by(Release.created_at.desc()).all()
    return releases

@router.get("/delivery/releases/detail/{release_id}")
def read_release_details(release_id: str, db: Session = Depends(get_db)):
    """
    Returns full details of a release, its artifact, and history of deployments.
    """
    release = db.query(Release).filter(Release.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")

    deployments = db.query(Deployment).filter(Deployment.release_id == release_id).all()
    
    deps_data = []
    for d in deployments:
        stages = db.query(DeploymentStage).filter(DeploymentStage.deployment_id == d.id).all()
        approvals = db.query(DeploymentApproval).filter(DeploymentApproval.deployment_id == d.id).all()
        checks = d.health_checks
        
        deps_data.append({
            "id": d.id,
            "environment": d.environment,
            "status": d.status,
            "provider": d.provider,
            "strategy": d.strategy,
            "started_at": d.started_at,
            "completed_at": d.completed_at,
            "error_message": d.error_message,
            "stages": stages,
            "approvals": approvals,
            "health_checks": checks
        })

    return {
        "release": release,
        "deployments": deps_data
    }

@router.post("/delivery/releases")
def trigger_release_pipeline(payload: ReleaseCreateRequest, db: Session = Depends(get_db)):
    """
    Assembles the code stashed in the workspace editor and launches the delivery build and deployment checks.
    """
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    files = payload.files
    if not files:
        # Resolve latest stashed files in the database from current ArtifactVersion (source)
        latest_art = db.query(ArtifactVersion).filter(
            ArtifactVersion.project_id == payload.project_id
        ).order_by(ArtifactVersion.version.desc()).first()

        if not latest_art:
            # Fallback placeholder code files if none exist in autonomous versions yet
            files = {
                "vehicle_service.py": "class VehicleServiceBooking:\n    def validate_booking(self, slot):\n        return True\n",
                "requirements.txt": "fastapi>=0.100.0\nsqlalchemy>=2.0.0\n",
                "Dockerfile": "FROM python:3.10-slim\nWORKDIR /app\nCOPY . .\nUSER guest\nCMD [\"python\", \"vehicle_service.py\"]\n"
            }
        else:
            files = json.loads(latest_art.files)

    # Trigger delivery run
    outcome = DeliveryPipeline.trigger_delivery_pipeline(
        project_id=payload.project_id,
        files=files,
        version=payload.version,
        environment=payload.environment,
        created_by=payload.created_by,
        db=db,
        simulate_health_failure=payload.simulate_health_failure
    )
    return outcome

@router.post("/delivery/approvals/{approval_id}")
def submit_deployment_approval(
    approval_id: str,
    payload: ApprovalSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Submits reviewer comments and resume/rejections choice.
    """
    appr = db.query(DeploymentApproval).filter(DeploymentApproval.id == approval_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail="Approval checkpoint not found")

    dep = appr.deployment
    if not dep:
        raise HTTPException(status_code=400, detail="Deployment associated with approval not found")

    outcome = DeliveryPipeline.resume_deployment_after_approval(
        deployment_id=dep.id,
        approval_id=approval_id,
        approved=payload.approved,
        comments=payload.comments,
        approved_by=payload.approved_by,
        db=db,
        simulate_health_failure=payload.simulate_health_failure
    )
    return outcome

@router.post("/delivery/deployments/{deployment_id}/rollback")
def rollback_deployment(deployment_id: str, db: Session = Depends(get_db)):
    """
    Manually triggers codebase rollback restoration back to previous version.
    """
    success, msg = RollbackManager.execute_rollback(deployment_id, db)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "SUCCESS", "message": msg}
