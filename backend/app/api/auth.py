from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import verify_password, create_access_token, decode_access_token
from ..models.governance import User, UserRole, Role, RolePermission, Permission

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    name: str
    role: str
    permissions: List[str]
    title: str

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserProfileResponse

ROLE_TITLES = {
    "ADMIN": "Studio Administrator & Security Officer",
    "DEVELOPER": "Lead AI Software Engineer",
    "TESTER": "QA & Diagnostics Specialist",
    "PROJECT_MANAGER": "Product & Engineering Manager",
    "ARCHITECT": "Principal System Architect",
    "SECURITY_REVIEWER": "Governance & Compliance Reviewer",
    "RELEASE_MANAGER": "DevOps & Release Manager",
    "VIEWER": "Observer & Stakeholder"
}

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    plain_password = req.password

    if not clean_email or not plain_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    # Authenticate only the account explicitly named by the caller.
    user = db.query(User).filter(
        (User.email.ilike(clean_email)) | (User.username.ilike(clean_email))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated."
        )

    # Verify password hash
    if not user.password_hash or not verify_password(plain_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Resolve assigned role
    user_role = db.query(UserRole).filter(UserRole.user_id == user.id).first()
    role_name = "DEVELOPER"
    if user_role:
        role = db.query(Role).filter(Role.id == user_role.role_id).first()
        if role:
            role_name = role.name

    # Resolve permissions
    role_perms = db.query(RolePermission).filter(RolePermission.role_id == (user_role.role_id if user_role else role_name)).all()
    perm_ids = [rp.permission_id for rp in role_perms]

    # Generate access token
    token = create_access_token(user.id, user.email, role_name)

    user_profile = UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        name=user.full_name or user.username,
        role=role_name,
        permissions=perm_ids,
        title=ROLE_TITLES.get(role_name, "Studio Team Member")
    )

    return LoginResponse(
        token=token,
        token_type="bearer",
        user=user_profile
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated."
        )

    user_role = db.query(UserRole).filter(UserRole.user_id == user.id).first()
    role_name = user_role.role_id if user_role else "DEVELOPER"
    
    role_perms = db.query(RolePermission).filter(RolePermission.role_id == role_name).all()
    perm_ids = [rp.permission_id for rp in role_perms]

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        name=user.full_name or user.username,
        role=role_name,
        permissions=perm_ids,
        title=ROLE_TITLES.get(role_name, "Studio Team Member")
    )

@router.post("/logout")
def logout():
    return {"message": "Session terminated successfully."}
