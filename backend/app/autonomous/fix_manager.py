import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.autonomous import FixAttempt, ArtifactVersion

class FixManager:
    @staticmethod
    def record_fix_attempt(
        iteration_id: str,
        analysis_id: str,
        suggested_fix: str,
        applied_patch: str,
        status: str,
        db: Session
    ) -> FixAttempt:
        """
        Stores details of a patch attempt made during the self-healing debug cycle.
        """
        attempt = FixAttempt(
            id=f"fix-{uuid.uuid4().hex[:8]}",
            iteration_id=iteration_id,
            debugger_analysis_id=analysis_id,
            suggested_fix=suggested_fix,
            applied_patch=applied_patch,
            status=status
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt

    @staticmethod
    def apply_patch_to_artifact(
        project_id: str,
        task_id: str,
        parent_artifact_id: str,
        changed_files: dict,  # { "path": "modified_content" }
        change_summary: str,
        created_by_agent: str,
        db: Session
    ) -> ArtifactVersion:
        """
        Derives a new code version (ArtifactVersion) by patching files from the parent artifact version.
        """
        parent = db.query(ArtifactVersion).filter(ArtifactVersion.id == parent_artifact_id).first()
        
        # Initialize files map from parent, fallback to empty
        merged_files = {}
        if parent:
            merged_files = json.loads(parent.files)
            parent_version = parent.version
        else:
            parent_version = 0

        # Inject changes
        for path, content in changed_files.items():
            merged_files[path] = content

        new_version = ArtifactVersion(
            id=f"art-{uuid.uuid4().hex[:8]}",
            version=parent_version + 1,
            parent_artifact_id=parent_artifact_id,
            project_id=project_id,
            task_id=task_id,
            files=json.dumps(merged_files),
            created_by_agent=created_by_agent,
            change_summary=change_summary
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        return new_version
