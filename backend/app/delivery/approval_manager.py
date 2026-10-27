import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.delivery import DeploymentApproval, Deployment, Release

logger = logging.getLogger(__name__)

class ApprovalManager:
    @staticmethod
    def request_approval(
        deployment_id: str,
        db: Session
    ) -> DeploymentApproval:
        """
        Creates a pending human verification checkpoint for a deployment.
        """
        approval_id = f"appr-{uuid.uuid4().hex[:8]}"
        
        db_appr = DeploymentApproval(
            id=approval_id,
            deployment_id=deployment_id,
            status="PENDING"
        )
        db.add(db_appr)
        db.commit()
        db.refresh(db_appr)
        
        # Transition deployment status to WAITING
        dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        if dep:
            dep.status = "VERIFYING"
            release = dep.release
            if release:
                release.status = "APPROVAL_REQUIRED"
            db.commit()
            
        logger.info(f"Human deployment verification requested. ID: {approval_id}")
        return db_appr

    @staticmethod
    def submit_approval(
        approval_id: str,
        comments: str,
        approved_by: str,
        status: str,  # APPROVED or REJECTED
        db: Session
    ) -> bool:
        """
        Processes human review input. If approved, allow deployment pipeline to proceed.
        """
        appr = db.query(DeploymentApproval).filter(DeploymentApproval.id == approval_id).first()
        if not appr:
            return False

        appr.status = status.upper()
        appr.comments = comments
        appr.approved_by = approved_by
        appr.approved_at = datetime.utcnow()
        db.commit()

        dep = appr.deployment
        if dep:
            release = dep.release
            if status.upper() == "APPROVED":
                dep.status = "DEPLOYING"
                if release:
                    release.status = "APPROVED"
                    release.approved_by = approved_by
                db.commit()
                logger.info(f"Deployment approval GRANTED by human '{approved_by}'")
            else:
                dep.status = "FAILED"
                dep.error_message = f"Deployment rejected by human. Comments: {comments}"
                if release:
                    release.status = "CANCELLED"
                db.commit()
                logger.warning(f"Deployment approval REJECTED by human '{approved_by}'")
                
        return True
