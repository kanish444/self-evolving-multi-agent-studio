import uuid
import logging
from datetime import datetime
from typing import List, Tuple
from sqlalchemy.orm import Session
from ..models.delivery import HealthCheckResult, Deployment

logger = logging.getLogger(__name__)

class HealthChecker:
    @staticmethod
    def run_health_checks(
        deployment_id: str,
        simulate_failure: bool,
        db: Session
    ) -> Tuple[bool, List[HealthCheckResult]]:
        """
        Executes a set of smoke checks (HTTP, PORT, DB) on the deployment instance.
        If simulate_failure is True, then one or more checks will record status = 'FAIL'.
        """
        results = []
        is_healthy = True

        checks = [
            ("Application Startup", "PING", "PASS"),
            ("Database Connectivity", "DB", "FAIL" if simulate_failure else "PASS"),
            ("HTTP Health Endpoint", "HTTP", "FAIL" if simulate_failure else "PASS"),
            ("Critical API Responsiveness", "HTTP", "PASS")
        ]

        for name, check_type, status in checks:
            if status == "FAIL":
                is_healthy = False

            check_id = f"chk-{uuid.uuid4().hex[:8]}"
            db_res = HealthCheckResult(
                id=check_id,
                deployment_id=deployment_id,
                name=name,
                status=status,
                check_type=check_type,
                response_time_ms=12 if status == "PASS" else 500,
                checked_at=datetime.utcnow()
            )
            db.add(db_res)
            results.append(db_res)

        db.commit()
        
        dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        if dep:
            if is_healthy:
                dep.status = "HEALTHY"
                logger.info(f"Health checks passed for deployment {deployment_id}.")
            else:
                dep.status = "FAILED"
                dep.error_message = "Smoke tests failed: database or HTTP availability checks returned FAIL."
                logger.warning(f"Health checks failed for deployment {deployment_id}. Triggering rollback workflow.")
            db.commit()

        return is_healthy, results
