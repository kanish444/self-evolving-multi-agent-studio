from pydantic import BaseModel, Field
from typing import List, Optional

class PolicyRecommendationSchema(BaseModel):
    policy_id: str = Field(description="The ID of the policy to improve, or NEW for a new policy recommendation")
    suggested_rules: str = Field(description="JSON rules rules mapping representing the suggested change")
    reason: str = Field(description="AI explanation for recommending this rule modification or restriction")

class BehaviorAnomalySchema(BaseModel):
    unusual_behavior_flag: bool = Field(description="True if unusual agent behavior or malicious patterns are detected")
    confidence: float = Field(description="AI confidence score between 0.0 and 1.0")
    explanation: str = Field(description="Explanation of the unusual behavioral pattern observed")

class GovernanceReportSchema(BaseModel):
    violations_analysis: str = Field(description="Concise analysis of recent policy violations and security events")
    permission_conflicts: List[str] = Field(description="List of detected privilege overrides, broad scope permissions, or permission conflicts")
    recommendations: List[PolicyRecommendationSchema] = Field(description="Policy improvement suggestions for human review")
    anomalies: List[BehaviorAnomalySchema] = Field(description="Identified behavioral deviations or escalation attempts")
