from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from .database import get_db
from .security import decode_access_token
from ..models.governance import User, UserRole, Role, RolePermission

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates JWT Bearer token from Authorization header and returns the authenticated User.
    Derives the actor strictly from the authenticated session.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or has been deactivated."
        )

    return user

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns authenticated User if valid token present, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def require_permission(permission_id: str):
    """
    Dependency factory to check if the authenticated user has a specific RBAC permission.
    """
    def permission_checker(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        user_role = db.query(UserRole).filter(UserRole.user_id == user.id).first()
        role_name = user_role.role_id if user_role else "VIEWER"
        
        # ADMIN has all permissions
        if role_name == "ADMIN":
            return user

        role_perm = db.query(RolePermission).filter(
            RolePermission.role_id == role_name,
            RolePermission.permission_id == permission_id
        ).first()

        if not role_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Permission '{permission_id}' required."
            )
        return user

    return permission_checker
