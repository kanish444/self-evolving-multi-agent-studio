import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.delivery import Release, Deployment, RollbackRecord
from .deployment_manager import LocalDeploymentProvider
from .artifact_manager import DatabaseArtifactRegistry

logger = logging.getLogger(__name__)

class RollbackManager:
    @staticmethod
    def execute_rollback(
        failed_deployment_id: str,
        db: Session
    ) -> tuple[bool, str]:
        """
        Rolls back the environment files to the previous stable release.
        Transitions the failed deployment to ROLLED_BACK.
        """
        # 1. Retrieve failed deployment
        failed_dep = db.query(Deployment).filter(Deployment.id == failed_deployment_id).first()
        if not failed_dep:
            return False, "Failed deployment not found"

        failed_release = failed_dep.release
        if not failed_release:
            return False, "Release associated with deployment not found"

        # 2. Identify previous stable release version for this environment
        previous_release = db.query(Release).filter(
            Release.project_id == failed_release.project_id,
            Release.environment == failed_release.environment,
            Release.status == "DEPLOYED"
        ).order_by(Release.deployed_at.desc()).first()

        if not previous_release:
            # Fallback: find any older successfully validated release candidate
            previous_release = db.query(Release).filter(
                Release.project_id == failed_release.project_id,
                Release.environment == failed_release.environment,
                Release.id != failed_release.id,
                Release.status == "APPROVED"
            ).order_by(Release.created_at.desc()).first()

        if not previous_release or not previous_release.artifact_id:
            return False, "No previous stable release or artifact found to roll back to"

        # 3. Mark failed deployment as ROLLING_BACK
        failed_dep.status = "ROLLING_BACK"
        db.commit()

        # 4. Generate Rollback record in database
        rollback_id = f"rb-{uuid.uuid4().hex[:8]}"
        db_rb = RollbackRecord(
            id=rollback_id,
            deployment_id=failed_deployment_id,
            previous_release_id=previous_release.id,
            status="RUNNING"
        )
        db.add(db_rb)
        db.commit()

        # 5. Extract files from previous artifact registry
        registry = DatabaseArtifactRegistry()
        prev_files = registry.pull(previous_release.artifact_id, db)
        if not prev_files:
            db_rb.status = "FAILED"
            db_rb.error_message = "Could not pull files from previous artifact version."
            failed_dep.status = "FAILED"
            db.commit()
            return False, "Pulling previous artifact files failed"

        # 6. Push files back into environment scratch sandbox
        provider = LocalDeploymentProvider()
        success = provider.rollback(failed_deployment_id, prev_files, db)
        
        if success:
            db_rb.status = "COMPLETED"
            failed_dep.status = "ROLLED_BACK"
            
            # Transition release status
            failed_release.status = "ROLLED_BACK"
            
            db.commit()
            logger.info(f"Successfully rolled back environment to stable release {previous_release.version} ({previous_release.id})")
            return True, f"Rollback to version {previous_release.version} succeeded."
        else:
            db_rb.status = "FAILED"
            db_rb.error_message = "Failed to copy rollback files to scratch path."
            failed_dep.status = "FAILED"
            db.commit()
            return False, "Failed to copy rollback files"
