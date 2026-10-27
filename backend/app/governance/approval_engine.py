import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.governance import GovernedAction, ApprovalRequest, AuditEvent, PolicyViolation
from ..governance.policy_engine import PolicyEngine

class ApprovalEngine:
    @staticmethod
    def create_approval_request(
        actor_type: str,
        actor_id: str,
        action_type: str,
        project_id: Optional[str],
        environment: Optional[str],
        resource: Optional[str],
        risk_level: str,
        reason: str,
        policy_id: Optional[str],
        db: Session,
        expires_in_hours: int = 24
    ) -> ApprovalRequest:
        """Saves a governed action as PENDING and spawns an ApprovalRequest with expiration."""
        action_id = f"act-{uuid.uuid4().hex[:8]}"
        req_id = f"apr-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=expires_in_hours)
        
        # 1. Create Governed Action record
        g_action = GovernedAction(
            id=action_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action_type=action_type,
            project_id=project_id,
            environment=environment,
            resource=resource,
            risk_level=risk_level,
            policy_result="APPROVAL_REQUIRED",
            approval_status="PENDING",
            created_at=now
        )
        db.add(g_action)
        
        # 2. Create Approval Request record
        request = ApprovalRequest(
            id=req_id,
            action_id=action_id,
            requester=actor_id,
            approver=None,
            risk_level=risk_level,
            reason=reason,
            status="PENDING",
            created_at=now,
            expires_at=expires_at
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        
        # 3. Log Audit event
        PolicyEngine.log_audit(
            actor_type, actor_id, action_type, resource, project_id, environment,
            "APPROVAL_REQUIRED", policy_id, risk_level, req_id, db
        )
        
        return request

    @staticmethod
    def approve_request(request_id: str, approver_id: str, db: Session) -> Dict[str, Any]:
        """Approves a pending request enforcing Four-Eyes Principle and updates the associated governed action status."""
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
        if not req:
            return {"success": False, "message": "Approval request not found"}
            
        # Check if already resolved or expired
        if req.status != "PENDING":
            return {"success": False, "message": f"Approval request is already {req.status}"}
            
        if req.expires_at and req.expires_at < datetime.utcnow():
            req.status = "EXPIRED"
            req.resolved_at = datetime.utcnow()
            db.commit()
            return {"success": False, "message": "Approval request has expired"}
            
        # Enforce Four-Eyes Principle: Requester != Approver
        if req.requester == approver_id:
            # Create a Policy Violation for attempting to self-approve!
            violation_id = f"vio-{uuid.uuid4().hex[:8]}"
            violation = PolicyViolation(
                id=violation_id,
                actor_type="USER",
                actor_id=approver_id,
                action="SELF_APPROVE_ATTEMPT",
                severity="HIGH",
                description=f"User {approver_id} attempted to self-approve approval request {request_id}",
                detected_at=datetime.utcnow(),
                status="DETECTED"
            )
            db.add(violation)
            db.commit()
            
            PolicyEngine.log_audit(
                "USER", approver_id, "SELF_APPROVE_ATTEMPT", request_id, None, None,
                "DENY", None, "HIGH", req.id, db
            )
            
            return {
                "success": False,
                "message": "Four-Eyes Principle violation: Requester cannot approve their own request"
            }

        # Approve Request
        req.status = "APPROVED"
        req.approver = approver_id
        req.resolved_at = datetime.utcnow()
        
        # Update associated action status
        action = db.query(GovernedAction).filter(GovernedAction.id == req.action_id).first()
        if action:
            action.approval_status = "APPROVED"
            action.completed_at = datetime.utcnow()
            
        db.commit()
        
        # Log Audit event
        PolicyEngine.log_audit(
            "USER", approver_id, "APPROVE_REQUEST", req.action_id,
            action.project_id if action else None,
            action.environment if action else None,
            "ALLOW", None, req.risk_level, req.id, db
        )
        
        # Resume linked workflow task if applicable
        if action and action.resource and action.resource.startswith("task-"):
            try:
                from ..models.task import Task
                from ..models.orchestration import WorkflowRun
                
                task = db.query(Task).filter(Task.id == action.resource).first()
                if task:
                    task.status = "READY"
                    run = db.query(WorkflowRun).filter(WorkflowRun.id == task.workflow_run_id).first()
                    if run:
                        run.status = "RUNNING"
                    db.commit()
            except Exception:
                pass
                
        return {"success": True, "message": "Request approved successfully", "action_id": req.action_id}

    @staticmethod
    def reject_request(request_id: str, approver_id: str, db: Session, reason: Optional[str] = None) -> Dict[str, Any]:
        """Rejects a pending request."""
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
        if not req:
            return {"success": False, "message": "Approval request not found"}
            
        if req.status != "PENDING":
            return {"success": False, "message": f"Approval request is already {req.status}"}
            
        req.status = "REJECTED"
        req.approver = approver_id
        req.resolved_at = datetime.utcnow()
        if reason:
            req.reason = f"{req.reason or ''} (Rejection reason: {reason})"
        
        # Update associated action status
        action = db.query(GovernedAction).filter(GovernedAction.id == req.action_id).first()
        if action:
            action.approval_status = "REJECTED"
            action.completed_at = datetime.utcnow()
            
        db.commit()
        
        # Log Audit event
        PolicyEngine.log_audit(
            "USER", approver_id, "REJECT_REQUEST", req.action_id,
            action.project_id if action else None,
            action.environment if action else None,
            "DENY", None, req.risk_level, req.id, db
        )
        
        # Terminate linked workflow task if applicable
        if action and action.resource and action.resource.startswith("task-"):
            try:
                from ..models.task import Task
                from ..models.orchestration import WorkflowRun
                
                task = db.query(Task).filter(Task.id == action.resource).first()
                if task:
                    task.status = "FAILED"
                    run = db.query(WorkflowRun).filter(WorkflowRun.id == task.workflow_run_id).first()
                    if run:
                        run.status = "FAILED"
                        run.error_message = f"Task execution rejected by Operator: {req.reason}"
                    db.commit()
            except Exception:
                pass

        return {"success": True, "message": "Request rejected successfully"}

    @staticmethod
    def cancel_request(request_id: str, actor_id: str, db: Session) -> Dict[str, Any]:
        """Cancels a pending request."""
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
        if not req:
            return {"success": False, "message": "Approval request not found"}
            
        if req.status != "PENDING":
            return {"success": False, "message": f"Approval request is already {req.status}"}
            
        req.status = "CANCELLED"
        req.resolved_at = datetime.utcnow()
        
        action = db.query(GovernedAction).filter(GovernedAction.id == req.action_id).first()
        if action:
            action.approval_status = "CANCELLED"
            action.completed_at = datetime.utcnow()
            
        db.commit()
        return {"success": True, "message": "Request cancelled successfully"}

    @staticmethod
    def expire_active_requests(db: Session):
        """Automatically expires pending requests past their expiration time or older than 24 hours."""
        now = datetime.utcnow()
        fallback_time = now - timedelta(hours=24)
        
        expired_reqs = db.query(ApprovalRequest).filter(
            ApprovalRequest.status == "PENDING"
        ).all()
        
        for req in expired_reqs:
            is_expired = False
            if req.expires_at and req.expires_at < now:
                is_expired = True
            elif req.created_at < fallback_time:
                is_expired = True
                
            if is_expired:
                req.status = "EXPIRED"
                req.resolved_at = now
                
                action = db.query(GovernedAction).filter(GovernedAction.id == req.action_id).first()
                if action:
                    action.approval_status = "EXPIRED"
                    action.completed_at = now
        db.commit()
