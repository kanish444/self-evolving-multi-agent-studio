import json
import uuid
import logging
from sqlalchemy.orm import Session
from ..models.delivery import EnvironmentConfig

logger = logging.getLogger(__name__)

class EnvironmentManager:
    @staticmethod
    def get_or_create_env(
        project_id: str,
        environment_name: str,
        db: Session
    ) -> EnvironmentConfig:
        """
        Retrieves or creates the EnvironmentConfig profile for the target project.
        """
        env_name = environment_name.upper()
        env = db.query(EnvironmentConfig).filter(
            EnvironmentConfig.project_id == project_id,
            EnvironmentConfig.environment_name == env_name
        ).first()

        if not env:
            env_id = f"env-{uuid.uuid4().hex[:8]}"
            base_url = f"http://localhost:8000/envs/{env_name.lower()}"
            
            # Default configs
            runtime_config = {
                "DEBUG": "True" if env_name == "DEVELOPMENT" else "False",
                "DB_POOL_SIZE": 10 if env_name == "PRODUCTION" else 5,
                "API_TIMEOUT": 5.0
            }
            
            deployment_policy = {
                "strategy": "BLUE_GREEN" if env_name == "PRODUCTION" else "ROLLING",
                "approval_required": True if env_name == "PRODUCTION" else False,
                "auto_rollback_on_health_failure": True
            }
            
            health_check_config = {
                "endpoints": ["/health", "/api/health"],
                "interval_seconds": 30,
                "timeout_seconds": 5
            }

            env = EnvironmentConfig(
                id=env_id,
                project_id=project_id,
                environment_name=env_name,
                base_url=base_url,
                runtime_config=json.dumps(runtime_config),
                deployment_policy=json.dumps(deployment_policy),
                health_check_config=json.dumps(health_check_config)
            )
            db.add(env)
            db.commit()
            db.refresh(env)
            logger.info(f"Initialized new EnvironmentConfig profile '{env_name}' for project {project_id}")

        return env

    @staticmethod
    def get_runtime_config(env: EnvironmentConfig) -> dict:
        try:
            return json.loads(env.runtime_config) if env.runtime_config else {}
        except Exception:
            return {}

    @staticmethod
    def get_deployment_policy(env: EnvironmentConfig) -> dict:
        try:
            return json.loads(env.deployment_policy) if env.deployment_policy else {}
        except Exception:
            return {}
