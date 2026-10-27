import logging
import json
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from .build_manager import BuildManager
from .artifact_manager import DatabaseArtifactRegistry
from .release_manager import ReleaseManager
from .deployment_manager import DeploymentManager, LocalDeploymentProvider
from .approval_manager import ApprovalManager
from .health_checker import HealthChecker
from .rollback_manager import RollbackManager
from ..models.delivery import Release, Deployment, DeploymentStage
from ..models.autonomous import ArtifactVersion
from ..models.log import Log

logger = logging.getLogger(__name__)

class DeliveryPipeline:
    @staticmethod
    def _log_pipeline_event(
        project_id: str,
        release_id: str,
        deployment_id: str,
        environment: str,
        version: str,
        action: str,
        message: str,
        type_: str,
        db: Session
    ):
        """
        Integrates build and deployment events with Phase 8 logs & observability.
        Generates correlation IDs and traces.
        """
        trace_id = f"trace_dep_{deployment_id[-6:]}"
        corr_id = f"corr_rel_{release_id[-6:]}"
        
        db_log = Log(
            id=f"log-{uuid.uuid4().hex[:8]}" if "uuid" in globals() else f"log-{int(time.time()*1000)}",
            project_id=project_id,
            type=type_,  # INFO, WARNING, ERROR, SUCCESS
            status=action,  # e.g., "build.completed"
            action=action,
            message=message,
            trace_id=trace_id,
            correlation_id=corr_id,
            timestamp=datetime.utcnow().strftime("%H:%M:%S"),
            created_at=datetime.utcnow()
        )
        db.add(db_log)
        db.commit()

    @staticmethod
    def trigger_delivery_pipeline(
        project_id: str,
        files: Dict[str, str],
        version: str,
        environment: str,
        created_by: str,
        db: Session,
        simulate_health_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Runs the complete Phase 14 delivery pipeline.
        Returns pipeline outcome summary.
        """
        # Import local helpers dynamically to resolve uuid
        import uuid
        import time

        # 1. Execute Build & Gates
        build_success, build_msg, stage_results, packaged_files = BuildManager.run_build(
            project_id, files, version, db
        )

        if not build_success:
            return {
                "status": "BUILD_FAILED",
                "message": build_msg,
                "stages": stage_results
            }

        # 2. Push build deliverables to Artifact Registry
        registry = DatabaseArtifactRegistry()
        latest_art = db.query(ArtifactVersion).filter(ArtifactVersion.project_id == project_id).order_by(ArtifactVersion.version.desc()).first()
        next_ver_num = (latest_art.version + 1) if latest_art else 1
        
        artifact = registry.push(
            project_id=project_id,
            files=packaged_files,
            version=next_ver_num,
            created_by=created_by,
            parent_id=latest_art.id if latest_art else None,
            db=db
        )

        # 3. Create Release Candidate
        release = ReleaseManager.create_release(
            project_id=project_id,
            artifact_id=artifact.id,
            version=version,
            environment=environment.upper(),
            created_by=created_by,
            db=db
        )

        if release.status == "FAILED":
            return {
                "status": "QUALITY_GATE_FAILED",
                "message": "Quality gate assertions or static scans returned violations.",
                "release_id": release.id,
                "stages": stage_results
            }

        # 4. Initialize Deployment state-machine
        strategy = "BLUE_GREEN" if environment.upper() == "PRODUCTION" else "ROLLING"
        dep = DeploymentManager.initialize_deployment(release.id, strategy, db)
        
        # Log Pipeline start
        DeliveryPipeline._log_pipeline_event(
            project_id=project_id,
            release_id=release.id,
            deployment_id=dep.id,
            environment=environment,
            version=version,
            action="release.created",
            message=f"Release {version} created for environment {environment}. Risk: LOW.",
            type_="INFO",
            db=db
        )

        # 5. Execute Staging Preparation
        DeploymentManager.transition_stage(dep.id, "PREPARE", "RUNNING", "Preparing local workspace directories...", db)
        provider = LocalDeploymentProvider()
        prepare_ok = provider.prepare(dep.id, packaged_files, db)
        
        if not prepare_ok:
            DeploymentManager.transition_stage(dep.id, "PREPARE", "FAILED", "Failed to stash workspace deployment assets.", db)
            dep.status = "FAILED"
            dep.error_message = "Deployment preparation stage failed."
            release.status = "FAILED"
            db.commit()
            return {
                "status": "DEPLOYMENT_FAILED",
                "message": "Deployment preparation stashing failed.",
                "release_id": release.id,
                "deployment_id": dep.id,
                "stages": stage_results
            }
        
        DeploymentManager.transition_stage(dep.id, "PREPARE", "COMPLETED", "Deployment workspace directories initialized.", db)

        # 6. Verify approvals requirements before final rollout
        if release.status == "APPROVAL_REQUIRED":
            # Pause pipeline and create approval checkpoint
            appr = ApprovalManager.request_approval(dep.id, db)
            dep.status = "VERIFYING"
            db.commit()
            
            # Log approval required event
            DeliveryPipeline._log_pipeline_event(
                project_id=project_id,
                release_id=release.id,
                deployment_id=dep.id,
                environment=environment,
                version=version,
                action="approval.required",
                message=f"Human deployment approval requested for release candidate {version} in environment {environment}.",
                type_="WARNING",
                db=db
            )
            
            return {
                "status": "APPROVAL_REQUIRED",
                "message": "Production deployment paused. Human approval checkpoint required.",
                "release_id": release.id,
                "deployment_id": dep.id,
                "approval_id": appr.id,
                "stages": stage_results
            }

        # 7. Rollout deployment and run post-deploy smoke tests
        return DeliveryPipeline._execute_rollout(dep.id, simulate_health_failure, db)

    @staticmethod
    def _execute_rollout(
        deployment_id: str,
        simulate_failure: bool,
        db: Session
    ) -> Dict[str, Any]:
        """
        Rolls out deployment and performs post-deployment health smoke validations.
        """
        import uuid
        dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        release = dep.release

        # Transition Deploy Stage
        DeploymentManager.transition_stage(dep.id, "DEPLOY", "RUNNING", "Routing sandbox build ports...", db)
        provider = LocalDeploymentProvider()
        deploy_ok = provider.deploy(dep.id, db)
        
        if not deploy_ok:
            DeploymentManager.transition_stage(dep.id, "DEPLOY", "FAILED", "Failed to bind and compile local script ports.", db)
            dep.status = "FAILED"
            dep.error_message = "Deployment script execution failed."
            release.status = "FAILED"
            db.commit()
            return {
                "status": "DEPLOYMENT_FAILED",
                "message": "Deployment script execution failed.",
                "release_id": release.id,
                "deployment_id": dep.id
            }

        DeploymentManager.transition_stage(dep.id, "DEPLOY", "COMPLETED", "Staging local build complete. Port mapped.", db)

        # 8. Run Smoke testing / Health checks
        DeploymentManager.transition_stage(dep.id, "VERIFY", "RUNNING", "Initiating post-deployment smoke health checks...", db)
        healthy, check_results = HealthChecker.run_health_checks(dep.id, simulate_failure, db)

        trace_id = f"trace_dep_{dep.id[-6:]}"
        corr_id = f"corr_rel_{release.id[-6:]}"

        if healthy:
            DeploymentManager.transition_stage(dep.id, "VERIFY", "COMPLETED", "All smoke health assertions: PASS.", db)
            dep.status = "HEALTHY"
            dep.completed_at = datetime.utcnow()
            release.status = "DEPLOYED"
            release.deployed_at = datetime.utcnow()
            release.completed_at = datetime.utcnow()
            db.commit()

            # Log deployment completed success event
            DeliveryPipeline._log_pipeline_event(
                project_id=release.project_id,
                release_id=release.id,
                deployment_id=dep.id,
                environment=dep.environment,
                version=release.version,
                action="deployment.completed",
                message=f"Deployment successfully completed. Version {release.version} is now HEALTHY.",
                type_="SUCCESS",
                db=db
            )

            return {
                "status": "SUCCESS",
                "message": f"Deployment version {release.version} successfully completed.",
                "release_id": release.id,
                "deployment_id": dep.id
            }
        else:
            DeploymentManager.transition_stage(dep.id, "VERIFY", "FAILED", "Critical post-deployment health check failures detected.", db)
            dep.status = "FAILED"
            dep.completed_at = datetime.utcnow()
            
            # Log deployment failed warning
            DeliveryPipeline._log_pipeline_event(
                project_id=release.project_id,
                release_id=release.id,
                deployment_id=dep.id,
                environment=dep.environment,
                version=release.version,
                action="deployment.failed",
                message=f"Deployment version {release.version} health validation failed. Rolling back...",
                type_="ERROR",
                db=db
            )

            # Trigger Automatic Rollback
            logger.warning(f"Deployment {dep.id} failed health checks. Triggering automatic rollback.")
            
            # Log rollback started event
            DeliveryPipeline._log_pipeline_event(
                project_id=release.project_id,
                release_id=release.id,
                deployment_id=dep.id,
                environment=dep.environment,
                version=release.version,
                action="rollback.started",
                message="Automatic rollback initialized to recover previous stable release.",
                type_="WARNING",
                db=db
            )

            rb_success, rb_msg = RollbackManager.execute_rollback(dep.id, db)
            
            if rb_success:
                # Log rollback completed event
                DeliveryPipeline._log_pipeline_event(
                    project_id=release.project_id,
                    release_id=release.id,
                    deployment_id=dep.id,
                    environment=dep.environment,
                    version=release.version,
                    action="rollback.completed",
                    message="Rollback completed successfully. Previous stable release version active.",
                    type_="SUCCESS",
                    db=db
                )
                
                return {
                    "status": "ROLLED_BACK",
                    "message": f"Deployment failed health checks. Automatic rollback completed successfully. Details: {rb_msg}",
                    "release_id": release.id,
                    "deployment_id": dep.id
                }
            else:
                # Escalation
                logger.error(f"Rollback failed: {rb_msg}")
                DeliveryPipeline._log_pipeline_event(
                    project_id=release.project_id,
                    release_id=release.id,
                    deployment_id=dep.id,
                    environment=dep.environment,
                    version=release.version,
                    action="rollback.failed",
                    message=f"CRITICAL: Automatic rollback failed to restore previous stable version: {rb_msg}. HUMAN ESCALATION REQUIRED.",
                    type_="ERROR",
                    db=db
                )
                
                return {
                    "status": "FAILED_ROLLBACK_ERROR",
                    "message": f"Deployment health check failed and recovery rollback failed: {rb_msg}",
                    "release_id": release.id,
                    "deployment_id": dep.id
                }

    @staticmethod
    def resume_deployment_after_approval(
        deployment_id: str,
        approval_id: str,
        approved: bool,
        comments: str,
        approved_by: str,
        db: Session,
        simulate_health_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Resumes deployment execution after human approval checkpoint submission.
        """
        import uuid
        appr_status = "APPROVED" if approved else "REJECTED"
        ok = ApprovalManager.submit_approval(approval_id, comments, approved_by, appr_status, db)
        if not ok:
            return {"status": "ERROR", "message": "Failed to submit human approval checkpoint."}

        dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        release = dep.release

        trace_id = f"trace_dep_{dep.id[-6:]}"
        corr_id = f"corr_rel_{release.id[-6:]}"

        if not approved:
            # Log approval rejected event
            DeliveryPipeline._log_pipeline_event(
                project_id=release.project_id,
                release_id=release.id,
                deployment_id=dep.id,
                environment=dep.environment,
                version=release.version,
                action="approval.rejected",
                message=f"Human deployment approval rejected by '{approved_by}'. Comments: {comments}.",
                type_="ERROR",
                db=db
            )
            
            return {
                "status": "REJECTED",
                "message": f"Deployment and Release {release.version} was rejected by reviewer.",
                "release_id": release.id,
                "deployment_id": dep.id
            }

        # Log approval approved event
        DeliveryPipeline._log_pipeline_event(
            project_id=release.project_id,
            release_id=release.id,
            deployment_id=dep.id,
            environment=dep.environment,
            version=release.version,
            action="approval.granted",
            message=f"Human deployment approval granted by '{approved_by}'. Resuming deployment rollout...",
            type_="SUCCESS",
            db=db
        )

        # Resume rollout execution
        return DeliveryPipeline._execute_rollout(dep.id, simulate_health_failure, db)
