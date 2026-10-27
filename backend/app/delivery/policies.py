import re
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# Core safety settings
DEPLOYMENT_APPROVAL_REQUIRED = True

# Common secret regex patterns (masked in outputs)
SECRET_PATTERNS = {
    "AWS_KEY": re.compile(r"AKIA[0-9A-Z]{16}"),
    "GITHUB_TOKEN": re.compile(r"gh[opsr]_[0-9a-zA-Z]{36}"),
    "GENERIC_SECRET": re.compile(r"(?i)(secret|passwd|password|api[-_]?key|private[-_]?key|token)\s*[:=]\s*['\"][0-9a-zA-Z_\-]{16,}['\"]"),
    "CONNECTION_STRING": re.compile(r"(?i)(mongodb|postgres|mysql|sqlite|redis):\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_\-]+@")
}

# Permitted secure base images
ALLOWED_BASE_IMAGES = [
    "python:3.10-slim",
    "python:3.9-slim",
    "node:18-alpine",
    "node:20-alpine",
    "alpine:3.18"
]

class DeliveryPolicyEngine:
    @staticmethod
    def analyze_risk(
        files: Dict[str, str],
        config_updates: Dict[str, Any] = None
    ) -> str:
        """
        Analyzes the deployment risk level based on modified files and configs.
        Returns: LOW, MEDIUM, HIGH, CRITICAL.
        """
        has_db_migration = False
        has_auth_change = False
        has_security_change = False
        has_infra_change = False
        destructive_sql = False
        large_changes = len(files) > 5

        for path, content in files.items():
            path_lower = path.lower()
            content_lower = content.lower()

            # Check migrations
            if "alembic" in path_lower or "migration" in path_lower or path_lower.endswith(".sql"):
                has_db_migration = True
                # Check for destructive SQL patterns
                if "drop table" in content_lower or "drop database" in content_lower or "delete from" in content_lower:
                    destructive_sql = True

            # Check authentication changes
            if "auth" in path_lower or "login" in path_lower or "jwt" in path_lower or "credential" in path_lower:
                has_auth_change = True

            # Check security policy configs
            if "policy" in path_lower or "security" in path_lower or "sandbox" in path_lower:
                has_security_change = True

            # Check infrastructure
            if "dockerfile" in path_lower or "docker-compose" in path_lower or "k8s" in path_lower or ".github" in path_lower:
                has_infra_change = True

        if destructive_sql or has_auth_change:
            return "CRITICAL"
        if has_db_migration or has_security_change or has_infra_change:
            return "HIGH"
        if large_changes:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def scan_for_secrets(files: Dict[str, str]) -> Tuple[bool, List[str]]:
        """
        Scans all files for plain-text credentials or API tokens.
        Returns (is_clean, violations). Matches are masked in log responses.
        """
        violations = []
        is_clean = True

        for path, content in files.items():
            for name, pattern in SECRET_PATTERNS.items():
                matches = pattern.findall(content)
                if matches:
                    is_clean = False
                    # Mask the secret match details to prevent leaks in logs
                    for match in matches:
                        match_str = str(match)
                        masked = match_str[:4] + "********" + match_str[-4:] if len(match_str) > 8 else "********"
                        violations.append(f"Exposed potential secret '{name}' in file '{path}' (value: {masked})")

        return is_clean, violations

    @staticmethod
    def validate_dockerfile(dockerfile_content: str) -> Tuple[bool, List[str]]:
        """
        Ensures container packaging adheres to image security guidelines.
        Ensures non-root users are configured and bases are pinned and minimal.
        """
        violations = []
        lines = dockerfile_content.split("\n")
        
        has_from = False
        base_image = ""
        has_user = False

        for line in lines:
            line_strip = line.strip()
            if line_strip.startswith("FROM"):
                has_from = True
                parts = line_strip.split()
                if len(parts) > 1:
                    base_image = parts[1]
            if line_strip.startswith("USER"):
                # If a user is explicitly declared, we assume they avoid default root
                if "root" not in line_strip.lower():
                    has_user = True

        if not has_from:
            violations.append("Dockerfile does not contain a FROM statement")
        else:
            # Check base image compliance
            is_allowed = False
            for allowed in ALLOWED_BASE_IMAGES:
                if base_image.startswith(allowed) or base_image == allowed:
                    is_allowed = True
                    break
            if not is_allowed:
                violations.append(f"Base image '{base_image}' is not permitted. Must use pinned minimal images: {ALLOWED_BASE_IMAGES}")

        if not has_user:
            violations.append("Dockerfile runs as ROOT. Must configure USER statement to execute as non-root user.")

        return len(violations) == 0, violations

    @staticmethod
    def is_approval_required(environment: str, risk: str) -> bool:
        """
        Evaluates if human-in-the-loop validation is required.
        Staging deployments may bypass approval on low risk, but Production always requires approval.
        """
        if environment.upper() == "PRODUCTION":
            return True
        if environment.upper() == "STAGING" and risk in ["HIGH", "CRITICAL"]:
            return True
        return False
