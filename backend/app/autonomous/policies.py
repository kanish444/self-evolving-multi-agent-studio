from sqlalchemy.orm import Session
from ..models.autonomous import AutonomyPolicy

class PolicyEngine:
    @staticmethod
    def get_or_create_policy(project_id: str, db: Session) -> AutonomyPolicy:
        """
        Retrieves or initializes the Autonomy Policy settings block for a project.
        """
        policy = db.query(AutonomyPolicy).filter(AutonomyPolicy.project_id == project_id).first()
        if not policy:
            policy = AutonomyPolicy(
                project_id=project_id,
                level=1,  # 1 - ASSISTED by default
                max_iterations=5,
                max_debug_cycles=3,
                require_approval_for_dependencies=True,
                require_approval_for_architecture=True,
                require_approval_for_security_changes=True,
                allow_auto_retest=True,
                allow_auto_fix=True
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def is_approval_required(
        project_id: str,
        change_category: str,  # "dependencies", "architecture", "security"
        db: Session
    ) -> bool:
        """
        Validates if autonomy policy level demands human approval checkpoint before applying code modifications.
        """
        policy = PolicyEngine.get_or_create_policy(project_id, db)
        
        # Level 0 (Manual) always requires approval
        if policy.level == 0:
            return True
            
        # Level 2 (Controlled Autonomy) executes automatically unless specific high-risk blocks are triggered
        if policy.level == 2:
            if change_category == "security" and policy.require_approval_for_security_changes:
                return True
            if change_category == "architecture" and policy.require_approval_for_architecture:
                return True
            if change_category == "dependencies" and policy.require_approval_for_dependencies:
                return True
            return False

        # Level 1 (Assisted) defaults to requiring approval for key changes
        if change_category == "security" or change_category == "architecture" or change_category == "dependencies":
            return True
            
        return False
