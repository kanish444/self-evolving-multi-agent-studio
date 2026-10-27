from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ActionRecommendationSchema(BaseModel):
    action: str = Field(description="The action type, e.g. ROLLBACK, RESTART_SERVICE, SCALE_SERVICE, INVESTIGATE_DATABASE")
    reason: str = Field(description="Why this action is recommended based on the evidence")
    risk: str = Field(description="The risk associated with executing this action (e.g. HIGH, MEDIUM, LOW)")
    expected_impact: str = Field(description="What will happen once the action is taken")
    requires_approval: bool = Field(description="True if human approval is required under safety policy rules")

class IncidentAnalysisSchema(BaseModel):
    incident_type: str = Field(description="The type, e.g. AVAILABILITY, PERFORMANCE, APPLICATION_ERROR, DATABASE, DEPENDENCY, DEPLOYMENT, SECURITY, RESOURCE, UNKNOWN")
    summary: str = Field(description="A concise summary of the incident state")
    probable_root_cause: str = Field(description="The probable root cause, attributing to change/evidence")
    evidence: List[str] = Field(description="List of observed evidence (logs, metrics, health checks, deployments)")
    confidence: float = Field(description="Confidence value between 0.0 and 1.0 (must not represent absolute certainty)")
    impact: str = Field(description="Severity impact, e.g. LOW, MEDIUM, HIGH, CRITICAL")
    recommended_actions: List[ActionRecommendationSchema] = Field(description="List of remediation recommendations")
    requires_human: bool = Field(description="Whether a human operator must confirm the diagnostics/actions")

class IncidentRemediationPlanSchema(BaseModel):
    recommended_action: ActionRecommendationSchema = Field(description="The chosen primary recovery action")
    reasoning: str = Field(description="AI explanation for picking this action from recommendations")
    rollback_plan: str = Field(description="A backup plan if the remediation action fails or degrades the service further")

class LearnerCandidateSchema(BaseModel):
    problem: str = Field(description="Summary of the problem observed")
    root_cause: str = Field(description="Why the issue occurred")
    solution: str = Field(description="How it was resolved")
    evidence: str = Field(description="Evidence linking problem and solution")
    confidence: float = Field(description="Confidence score for this learning")
    scope: str = Field(description="The scope of code or architecture affected")

class AIPostIncidentReviewSchema(BaseModel):
    impact: str = Field(description="Assessment of user or system impact")
    root_cause: str = Field(description="Detailed analysis of the root cause")
    contributing_factors: List[str] = Field(description="Contributing factors, dependencies, configurations")
    what_went_well: List[str] = Field(description="Response actions that went well")
    what_went_wrong: List[str] = Field(description="System design or monitoring failures")
    corrective_actions: List[str] = Field(description="Immediate steps taken to restore service")
    preventive_actions: List[str] = Field(description="Long-term improvement actions suggested")
    learning_candidates: List[LearnerCandidateSchema] = Field(description="List of learning candidate patterns for database insertion")
