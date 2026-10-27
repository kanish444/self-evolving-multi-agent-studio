import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from .auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


def find_owned(db, project_id, user):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found in your account")
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if project_in.repo_url:
        raise HTTPException(422, "Repository import is not supported by the live workflow yet; create a local project without a repository URL.")
    if not project_in.name.strip() or not (project_in.description or "").strip():
        raise HTTPException(422, "Project name and description are required")
    project = Project(id="P" + uuid.uuid4().hex[:16], owner_id=user.id,
                      name=project_in.name.strip(), description=project_in.description.strip(), requirements=project_in.requirements or project_in.description.strip(), repo_url=project_in.repo_url,
                      status="PLANNING", current_iteration=1)
    from ..live import engine
    project.workspace_path = str(engine.directory(project.id) / "source")
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectResponse])
def read_projects(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Project).filter(Project.owner_id == user.id).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(project_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return find_owned(db, project_id, user)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = find_owned(db, project_id, user)
    for key, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from ..live import engine
    project = find_owned(db, project_id, user)
    if project_id in engine.BUSY:
        raise HTTPException(409, "Wait for the active project operation to finish")
    state = engine.load(project_id)
    if state.get("preview"):
        raise HTTPException(409, "Stop the project preview before deleting")
    db.delete(project)
    db.commit()

# Compatibility with the approved latest Dashboard. These endpoints invoke the
# real engine, never the previous deterministic architecture/scaffold templates.
import json
from fastapi import BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from ..live import engine
from .live import owned, approve as approve_live


class ArchitectChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    requirements: Optional[str] = None


class ArchitectPlanRequest(BaseModel):
    custom_notes: Optional[str] = None


class ApprovePlanRequest(BaseModel):
    assigned_roles: Optional[list[str]] = None
    plan_data: Optional[dict] = None
    notes: Optional[str] = None


class PermissionsGrantRequest(BaseModel):
    permissions: list[str]


def public_plan(plan):
    return {'scope': plan['summary'], 'acceptance_criteria': plan['acceptance'],
            'modules': plan['tasks'], 'architecture': plan['architecture'],
            'proposed_stack': plan['runtime'] + ' standard library + browser HTML/CSS/JavaScript',
            'required_resources': [{'resource': 'Project files', 'reason': 'Read and write this project only'},
                                   {'resource': 'Docker execution', 'reason': 'Run bounded tests and local preview'}],
            'agent_roles': engine.ROLES, 'execution_stages': ['Plan', 'Develop', 'Test', 'Fix', 'Review', 'Preview'],
            'assumptions': plan.get('questions', []), 'is_live_ai': True}


async def plan_request(project, message):
    try:
        engine.reserve(project.id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    (engine.directory(project.id) / 'cancel.requested').unlink(missing_ok=True)
    state = engine.load(project.id)
    state['messages'].append({'role': 'user', 'content': message})
    engine.save(project.id, state)
    requirement = f'Project: {project.name}\nRequirements: {project.requirements or project.description}\n' + '\n'.join(item['content'] for item in state['messages'][-12:])
    await engine.execute(project.id, requirement, 'plan')
    state = engine.load(project.id)
    if state['status'] not in {'AWAITING_APPROVAL', 'NEEDS_INPUT'}:
        raise HTTPException(503, state.get('error') or 'Architecture generation did not complete')
    return state


@router.post('/{project_id}/architect-chat')
async def architect_chat(payload: ArchitectChatRequest, project: Project = Depends(owned), db: Session = Depends(get_db)):
    state = await plan_request(project, payload.message)
    plan = state['plan']
    project.architecture_plan = json.dumps(public_plan(plan))
    db.commit()
    return {'reply': plan['architecture'], 'suggested_questions': plan['questions'], 'is_live_ai': True}


@router.post('/{project_id}/architect-plan')
async def architect_plan(payload: Optional[ArchitectPlanRequest] = None, project: Project = Depends(owned), db: Session = Depends(get_db)):
    state = await plan_request(project, payload.custom_notes if payload and payload.custom_notes else 'Prepare the architecture and acceptance criteria for this project.')
    result = public_plan(state['plan'])
    project.architecture_plan = json.dumps(result)
    db.commit()
    return result


@router.post('/{project_id}/permissions')
def permissions(payload: PermissionsGrantRequest, project: Project = Depends(owned), db: Session = Depends(get_db)):
    permitted = {'FILES_READ_WRITE', 'RUN_CODE_TESTS'}
    unknown = set(payload.permissions) - permitted
    if unknown:
        raise HTTPException(422, 'Unsupported permissions requested: ' + ', '.join(sorted(unknown)))
    project.permissions_granted = json.dumps(sorted(set(payload.permissions)))
    db.commit()
    return {'status': 'granted', 'permissions': sorted(set(payload.permissions))}


@router.post('/{project_id}/approve-plan')
def approve_plan(background: BackgroundTasks, payload: Optional[ApprovePlanRequest] = None,
                 project: Project = Depends(owned), db: Session = Depends(get_db)):
    state = engine.load(project.id)
    if not state.get('plan'):
        raise HTTPException(409, 'Generate a real architecture plan first')
    if payload and payload.plan_data:
        supplied = payload.plan_data
        expected = public_plan(state['plan'])
        # Do not silently ignore edits displayed in a review modal.
        if any(supplied.get(key, expected[key]) != expected[key] for key in ('scope', 'acceptance_criteria', 'modules', 'architecture', 'proposed_stack')):
            raise HTTPException(409, 'The reviewed plan changed. Send those changes to the Architect before approving.')
    granted = set(json.loads(project.permissions_granted or '[]'))
    if not {'FILES_READ_WRITE', 'RUN_CODE_TESTS'}.issubset(granted):
        raise HTTPException(409, 'Approve this project\'s file and execution scope first')
    approve_live(background, project, db)
    project.status = 'BUILDING'
    db.commit()
    return {'status': 'approved', 'project_status': 'BUILDING', 'assigned_roles': engine.ROLES}
