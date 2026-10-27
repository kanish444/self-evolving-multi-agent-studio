import logging
import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from .policies import DeliveryPolicyEngine
from .artifact_manager import DatabaseArtifactRegistry
from ..models.delivery import Release
from ..models.test_result import TestResult

logger = logging.getLogger(__name__)

class ReleaseManager:
    @staticmethod
    def parse_semver(version: str) -> tuple[int, int, int]:
        """
        Parses a version string like '1.2.3' to (1, 2, 3).
        """
        cleaned = version.strip().lower().lstrip("v")
        parts = cleaned.split(".")
        major = int(parts[0]) if len(parts) > 0 else 0
        minor = int(parts[1]) if len(parts) > 1 else 0
        patch = int(parts[2]) if len(parts) > 2 else 0
        return major, minor, patch

    @staticmethod
    def format_semver(major: int, minor: int, patch: int) -> str:
        return f"{major}.{minor}.{patch}"

    @staticmethod
    def increment_version(version: str, bump_type: str = "patch") -> str:
        """
        Increments semantic version based on bump type: major, minor, or patch.
        """
        try:
            major, minor, patch = ReleaseManager.parse_semver(version)
        except Exception:
            return "1.0.0"

        if bump_type.lower() == "major":
            major += 1
            minor = 0
            patch = 0
        elif bump_type.lower() == "minor":
            minor += 1
            patch = 0
        else:
            patch += 1

        return ReleaseManager.format_semver(major, minor, patch)

    @staticmethod
    def check_quality_gates(
        project_id: str,
        artifact_id: str,
        environment: str,
        db: Session
    ) -> tuple[bool, List[str]]:
        """
        Validates quality gates before release candidacy.
        """
        violations = []
        
        # 1. Verify artifact exists
        registry = DatabaseArtifactRegistry()
        art = registry.get(artifact_id, db)
        if not art:
            violations.append("Immutable artifact not found in registry")
            return False, violations

        # 2. Check test results - assert no failed tests in the database
        failing_tests = db.query(TestResult).filter(
            TestResult.project_id == project_id,
            TestResult.status == "FAILED"
        ).all()
        if failing_tests:
            violations.append(f"Quality Gate Failed: {len(failing_tests)} failing assertions present in workspace.")

        # 3. Check security scan results
        try:
            files_map = json.loads(art.files)
            clean, sec_violations = DeliveryPolicyEngine.scan_for_secrets(files_map)
            if not clean:
                violations.extend(sec_violations)
        except Exception as e:
            violations.append(f"Error parsing artifact files for security gate: {e}")

        return len(violations) == 0, violations

    @staticmethod
    def create_release(
        project_id: str,
        artifact_id: str,
        version: str,
        environment: str,
        created_by: str,
        db: Session
    ) -> Release:
        """
        Creates a new release row after running quality checks.
        If checks pass, assigns risk and sets state.
        """
        # Run quality gates
        passed, violations = ReleaseManager.check_quality_gates(project_id, artifact_id, environment, db)
        
        # Resolve risk level
        registry = DatabaseArtifactRegistry()
        files = registry.pull(artifact_id, db) or {}
        risk = DeliveryPolicyEngine.analyze_risk(files)

        status = "READY"
        if not passed:
            status = "FAILED"
        elif DeliveryPolicyEngine.is_approval_required(environment, risk):
            status = "APPROVAL_REQUIRED"

        # Determine rollback version (find latest DEPLOYED or COMPLETED release in this environment)
        latest_deployed = db.query(Release).filter(
            Release.project_id == project_id,
            Release.environment == environment,
            Release.status == "DEPLOYED"
        ).order_by(Release.deployed_at.desc()).first()
        
        rollback_ver = latest_deployed.version if latest_deployed else None

        release_id = f"rel-{uuid.uuid4().hex[:8]}"
        db_release = Release(
            id=release_id,
            project_id=project_id,
            artifact_id=artifact_id,
            version=version,
            environment=environment,
            status=status,
            created_by=created_by,
            rollback_reference=rollback_ver
        )

        db.add(db_release)
        db.commit()
        db.refresh(db_release)

        # Log release event if quality gates failed
        if status == "FAILED":
            logger.warning(f"Release {version} creation failed quality gates: {violations}")

        return db_release
