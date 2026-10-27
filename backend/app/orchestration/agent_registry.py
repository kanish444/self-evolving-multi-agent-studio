from .agents.project_manager import ProjectManagerAgent
from .agents.architect import ArchitectAgent
from .agents.developer import DeveloperAgent
from .agents.tester import TesterAgent
from .agents.debugger import DebuggerAgent
from .agents.reviewer import ReviewerAgent
from .agents.evolution import EvolutionAgent
from .agents.incident_analyst import IncidentAnalystAgent
from .agents.incident_response import IncidentResponseAgent
from .agents.governance import GovernanceAgent


class AgentRegistry:
    def __init__(self):
        self._agents = {}

    def register(self, role: str, agent_instance):
        self._agents[role] = agent_instance

    def get_agent(self, role: str):
        # Allow case-insensitive or exact role lookups
        role_upper = role.upper()
        if role_upper in self._agents:
            return self._agents[role_upper]
            
        # Fallbacks for common role mappings
        mappings = {
            "PM": "PROJECT_MANAGER",
            "PROJECT MANAGER": "PROJECT_MANAGER",
            "DEVELOPER": "DEVELOPER",
            "DEV": "DEVELOPER",
            "ARCHITECT": "ARCHITECT",
            "TESTER": "TESTER",
            "QA": "TESTER",
            "DEBUGGER": "DEBUGGER",
            "REVIEWER": "REVIEWER",
            "EVOLUTION": "EVOLUTION",
            "INCIDENT_ANALYST": "INCIDENT_ANALYST",
            "INCIDENT_RESPONSE": "INCIDENT_RESPONSE"
        }
        mapped_role = mappings.get(role_upper)
        if mapped_role:
            return self._agents.get(mapped_role)
            
        return None

# Global instance for project-wide lookup
registry = AgentRegistry()
registry.register("PROJECT_MANAGER", ProjectManagerAgent())
registry.register("ARCHITECT", ArchitectAgent())
registry.register("DEVELOPER", DeveloperAgent())
registry.register("TESTER", TesterAgent())
registry.register("DEBUGGER", DebuggerAgent())
registry.register("REVIEWER", ReviewerAgent())
registry.register("EVOLUTION", EvolutionAgent())
registry.register("INCIDENT_ANALYST", IncidentAnalystAgent())
registry.register("INCIDENT_RESPONSE", IncidentResponseAgent())
registry.register("GOVERNANCE", GovernanceAgent())


