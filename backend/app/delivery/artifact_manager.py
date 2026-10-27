import json
import uuid
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.autonomous import ArtifactVersion

logger = logging.getLogger(__name__)

class ArtifactRegistry(ABC):
    @abstractmethod
    def push(self, project_id: str, files: Dict[str, str], version: int, created_by: str, parent_id: Optional[str], db: Session) -> Any:
        pass

    @abstractmethod
    def pull(self, artifact_id: str, db: Session) -> Optional[Dict[str, str]]:
        pass

    @abstractmethod
    def get(self, artifact_id: str, db: Session) -> Optional[Any]:
        pass

    @abstractmethod
    def list(self, project_id: str, db: Session) -> List[Any]:
        pass

    @abstractmethod
    def delete(self, artifact_id: str, db: Session) -> bool:
        pass


class DatabaseArtifactRegistry(ArtifactRegistry):
    def push(
        self,
        project_id: str,
        files: Dict[str, str],
        version: int,
        created_by: str,
        parent_id: Optional[str],
        db: Session
    ) -> ArtifactVersion:
        """
        Pushes and saves the packaged build files into the SQLite database as an immutable ArtifactVersion.
        """
        artifact_id = f"art-{uuid.uuid4().hex[:8]}"
        
        db_artifact = ArtifactVersion(
            id=artifact_id,
            version=version,
            parent_artifact_id=parent_id,
            project_id=project_id,
            files=json.dumps(files),
            created_by_agent=created_by,
            change_summary=f"Package release version build {version}"
        )
        
        db.add(db_artifact)
        db.commit()
        db.refresh(db_artifact)
        
        logger.info(f"Successfully registered immutable build artifact '{artifact_id}' (version: {version})")
        return db_artifact

    def pull(self, artifact_id: str, db: Session) -> Optional[Dict[str, str]]:
        """
        Pulls files contents mapped by their path names.
        """
        art = self.get(artifact_id, db)
        if not art:
            return None
        try:
            return json.loads(art.files)
        except Exception:
            return {}

    def get(self, artifact_id: str, db: Session) -> Optional[ArtifactVersion]:
        """
        Retrieves the ArtifactVersion row object.
        """
        return db.query(ArtifactVersion).filter(ArtifactVersion.id == artifact_id).first()

    def list(self, project_id: str, db: Session) -> List[ArtifactVersion]:
        """
        Lists all artifacts belonging to a project.
        """
        return db.query(ArtifactVersion).filter(ArtifactVersion.project_id == project_id).order_by(ArtifactVersion.version.desc()).all()

    def delete(self, artifact_id: str, db: Session) -> bool:
        """
        Deletes the target artifact.
        """
        art = self.get(artifact_id, db)
        if not art:
            return False
        db.delete(art)
        db.commit()
        return True
