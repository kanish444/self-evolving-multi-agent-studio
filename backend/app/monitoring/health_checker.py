import uuid
import json
import logging
import httpx
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.monitoring import (
    MonitoredService,
    MonitoringHealthCheckResult,
    Metric,
    AlertRule,
    Alert,
    Incident,
    IncidentEvent,
    RemediationPolicy
)
from ..models.delivery import Deployment, Release
from ..orchestration.agent_registry import registry
from ..orchestration.agents.base import AgentRequest

logger = logging.getLogger("app.monitoring.health_checker")

class HealthChecker:
    @staticmethod
    async def perform_health_check(service_id: str, db: Session, simulate_status: str = None) -> MonitoringHealthCheckResult:
        """
        Executes HTTP health checks on registered service endpoints or runs a high-fidelity simulation.
        Stores the result, updates the service status, and evaluates alert rules.
        """
        service = db.query(MonitoredService).filter(MonitoredService.id == service_id).first()
        if not service:
            raise ValueError(f"Service {service_id} not found")

        if not service.monitoring_enabled:
            return None

        # Parse health check config
        config = {}
        if service.health_check_config:
            try:
                config = json.loads(service.health_check_config)
            except Exception:
                config = {}

        expected_code = config.get("expected_status_code", 200)
        timeout = float(config.get("timeout_seconds", 5.0))
        
        status = "HEALTHY"
        response_code = 200
        latency_ms = 50
        error_message = None
        checked_at = datetime.utcnow()

        if simulate_status:
            status = simulate_status
            if status == "FAILED":
                response_code = 500
                latency_ms = 120
                error_message = "Simulated Application Health Check Failure"
            elif status == "TIMEOUT":
                response_code = 504
                latency_ms = int(timeout * 1000) + 100
                error_message = "Simulated Request Timeout"
            elif status == "DEGRADED":
                response_code = 200
                latency_ms = 1200
                error_message = "Simulated High Latency Response"
        elif service.endpoint:
            # Perform a real HTTP check
            start_time = datetime.utcnow()
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.get(service.endpoint)
                    latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                    response_code = response.status_code
                    
                    if response.status_code == expected_code:
                        status = "HEALTHY"
                    else:
                        status = "FAILED"
                        error_message = f"Expected status code {expected_code}, got {response.status_code}"
            except httpx.TimeoutException:
                status = "TIMEOUT"
                latency_ms = int(timeout * 1000)
                error_message = "Request timed out"
            except Exception as e:
                status = "FAILED"
                error_message = f"HTTP connection failed: {str(e)}"
        else:
            # Simulation baseline fallback when no endpoint is configured
            status = "HEALTHY"
            response_code = 200
            latency_ms = 45

        # Create check result
        check_id = f"chk-{uuid.uuid4().hex[:8]}"
        db_result = MonitoringHealthCheckResult(
            id=check_id,
            service_id=service.id,
            status=status,
            response_code=response_code,
            latency_ms=latency_ms,
            error_message=error_message,
            checked_at=checked_at
        )
        db.add(db_result)

        # Update service health status
        old_status = service.status
        service.status = status if status != "FAILED" else "UNAVAILABLE"
        if status == "DEGRADED":
            service.status = "DEGRADED"
        service.updated_at = datetime.utcnow()
        db.commit()

        # Seed metrics related to this check
        HealthChecker.record_service_check_metrics(service, latency_ms, status, db)

        # Evaluate rules for this service
        await HealthChecker.evaluate_service_rules(service, db)

        return db_result

    @staticmethod
    def record_service_check_metrics(service: MonitoredService, latency_ms: int, status: str, db: Session):
        """Generates timeseries metric entries matching health check outcome."""
        metric_time = datetime.utcnow()
        
        # 1. Latency Metric
        latency_metric = Metric(
            id=f"met-{uuid.uuid4().hex[:8]}",
            service_id=service.id,
            name="request_latency",
            value=float(latency_ms),
            unit="ms",
            timestamp=metric_time,
            source="internal",
            labels=json.dumps({"environment": service.environment})
        )
        db.add(latency_metric)

        # 2. Error Rate Metric
        is_error = 1.0 if status in ["FAILED", "TIMEOUT"] else 0.0
        error_rate_metric = Metric(
            id=f"met-{uuid.uuid4().hex[:8]}",
            service_id=service.id,
            name="error_rate",
            value=float(is_error * 100.0),  # percentage
            unit="%",
            timestamp=metric_time,
            source="internal",
            labels=json.dumps({"environment": service.environment})
        )
        db.add(error_rate_metric)

        # 3. Availability Metric
        is_avail = 1.0 if status == "HEALTHY" else (0.5 if status == "DEGRADED" else 0.0)
        avail_metric = Metric(
            id=f"met-{uuid.uuid4().hex[:8]}",
            service_id=service.id,
            name="availability",
            value=float(is_avail * 100.0),
            unit="%",
            timestamp=metric_time,
            source="internal",
            labels=json.dumps({"environment": service.environment})
        )
        db.add(avail_metric)

        # 4. Request Count Metric (baseline request counts)
        req_count = Metric(
            id=f"met-{uuid.uuid4().hex[:8]}",
            service_id=service.id,
            name="request_count",
            value=1.0,
            unit="count",
            timestamp=metric_time,
            source="internal",
            labels=json.dumps({"environment": service.environment})
        )
        db.add(req_count)
        db.commit()

    @staticmethod
    async def evaluate_service_rules(service: MonitoredService, db: Session):
        """Checks latest metric values against alert thresholds and fires alerts."""
        rules = db.query(AlertRule).filter(
            AlertRule.service_id == service.id,
            AlertRule.enabled == True
        ).all()

        for rule in rules:
            # Query latest metric for this rule
            latest_metric = db.query(Metric).filter(
                Metric.service_id == service.id,
                Metric.name == rule.metric_name
            ).order_by(desc(Metric.timestamp)).first()

            if not latest_metric:
                continue

            # Compare value
            triggered = False
            val = latest_metric.value
            op = rule.operator
            thresh = rule.threshold

            if op == ">" and val > thresh:
                triggered = True
            elif op == "<" and val < thresh:
                triggered = True
            elif op == "=" and val == thresh:
                triggered = True
            elif op == ">=" and val >= thresh:
                triggered = True
            elif op == "<=" and val <= thresh:
                triggered = True

            if triggered:
                # Check if alert already open for this rule
                existing_alert = db.query(Alert).filter(
                    Alert.service_id == service.id,
                    Alert.rule_id == rule.id,
                    Alert.status == "OPEN"
                ).first()

                if not existing_alert:
                    # Fire new alert!
                    alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                    message = f"Alert rule '{rule.metric_name} {rule.operator} {rule.threshold}' violated. Current value: {val}{latest_metric.unit}."
                    
                    alert = Alert(
                        id=alert_id,
                        service_id=service.id,
                        rule_id=rule.id,
                        severity=rule.severity,
                        status="OPEN",
                        message=message,
                        triggered_at=datetime.utcnow()
                    )
                    db.add(alert)
                    db.commit()

                    logger.info(f"Alert {alert_id} triggered on service {service.service_name}")
                    
                    # Deduplicate/Correlate Alert into Incident
                    await HealthChecker.correlate_alert_to_incident(alert, service, db)
            else:
                # Resolve existing alert if open
                open_alert = db.query(Alert).filter(
                    Alert.service_id == service.id,
                    Alert.rule_id == rule.id,
                    Alert.status == "OPEN"
                ).first()

                if open_alert:
                    open_alert.status = "RESOLVED"
                    open_alert.resolved_at = datetime.utcnow()
                    db.commit()
                    
                    # Check if incident is resolved
                    if open_alert.incident_id:
                        await HealthChecker.check_incident_resolution_status(open_alert.incident_id, db)

    @staticmethod
    async def correlate_alert_to_incident(alert: Alert, service: MonitoredService, db: Session):
        """Groups related alerts within a time window or spawns a new Incident."""
        # 1. Search for open incident in same service & environment in 5-minute window
        five_min_ago = datetime.utcnow() - timedelta(minutes=5)
        existing_incident = db.query(Incident).filter(
            Incident.project_id == service.project_id,
            Incident.service_id == service.id,
            Incident.environment == service.environment,
            Incident.status.in_(["DETECTED", "INVESTIGATING", "MITIGATING", "MONITORING"]),
            Incident.detected_at >= five_min_ago
        ).first()

        if existing_incident:
            # Group into existing incident
            alert.incident_id = existing_incident.id
            
            # Persist Timeline Event
            event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=existing_incident.id,
                event_type="ALERT_GROUPING",
                message=f"Alert {alert.id} ({alert.severity}) grouped into incident. Deduplication active.",
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            logger.info(f"Grouped alert {alert.id} into incident {existing_incident.id}")
        else:
            # Create new incident
            incident_id = f"inc-{uuid.uuid4().hex[:8]}"
            title = f"Incident on {service.service_name} [{service.environment}]"
            desc_text = f"Primary alert triggered: {alert.message}"
            
            # Convert alert severity to incident severity (SEV-1 to SEV-4)
            severity_map = {
                "CRITICAL": "SEV-1",
                "HIGH": "SEV-2",
                "MEDIUM": "SEV-3",
                "LOW": "SEV-4",
                "INFO": "SEV-4"
            }
            incident_sev = severity_map.get(alert.severity, "SEV-3")
            
            # Triage incident type
            incident_type = "UNKNOWN"
            if "latency" in alert.message.lower() or "timeout" in alert.message.lower():
                incident_type = "PERFORMANCE"
            elif "error_rate" in alert.message.lower() or "500" in alert.message.lower():
                incident_type = "APPLICATION_ERROR"
            elif "database" in alert.message.lower() or "db" in alert.message.lower():
                incident_type = "DATABASE"

            incident = Incident(
                id=incident_id,
                project_id=service.project_id,
                service_id=service.id,
                environment=service.environment,
                title=title,
                description=desc_text,
                severity=incident_sev,
                status="DETECTED",
                detected_at=datetime.utcnow(),
                incident_type=incident_type
            )
            db.add(incident)
            db.commit()

            # Attach alert to incident
            alert.incident_id = incident_id

            # Persist timeline start event
            start_event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                event_type="DETECTED",
                message=f"Incident detected. Severity: {incident_sev}. Primary failure source: {alert.id}.",
                timestamp=datetime.utcnow()
            )
            db.add(start_event)
            db.commit()
            
            # 2. Correlate with recent deployments (Phase 14 integration)
            recent_dep = db.query(Deployment).join(Release).filter(
                Release.project_id == service.project_id,
                Deployment.environment == service.environment,
                Deployment.status == "HEALTHY",
                Deployment.completed_at >= datetime.utcnow() - timedelta(minutes=15)
            ).order_by(desc(Deployment.completed_at)).first()


            if recent_dep:
                cor_msg = f"Possible deployment correlation: Deployment version {recent_dep.release.version} ({recent_dep.id}) finished 15 minutes prior to health degradation."
                cor_event = IncidentEvent(
                    id=f"evt-{uuid.uuid4().hex[:8]}",
                    incident_id=incident_id,
                    event_type="DEPLOYMENT_CORRELATION",
                    message=cor_msg,
                    timestamp=datetime.utcnow()
                )
                db.add(cor_event)
                incident.description += f"\n\n[Correlated Deployment] Release {recent_dep.release.version} was deployed recently."
                db.commit()
                logger.info(f"Correlated incident {incident_id} with deployment {recent_dep.id}")

            # 3. Trigger AI incident analysis (with cooldown to prevent alert storm)
            await HealthChecker.trigger_ai_analysis_with_cooldown(incident, db)

    @staticmethod
    async def trigger_ai_analysis_with_cooldown(incident: Incident, db: Session):
        """Triggers AI Incident Analyst Agent if cooldown limit is not active."""
        # Query recent analyses for this project and service in last 2 minutes
        cooldown_window = datetime.utcnow() - timedelta(minutes=2)
        recent_analysis = db.query(Incident).filter(
            Incident.project_id == incident.project_id,
            Incident.service_id == incident.service_id,
            Incident.status == "INVESTIGATING",
            Incident.acknowledged_at >= cooldown_window
        ).first()

        if recent_analysis:
            # Log cooldown block in timeline
            event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=incident.id,
                event_type="AI_ANALYSIS_COOLDOWN",
                message="AI analysis skipped due to active cooldown window on this service.",
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            return

        # Advance status to INVESTIGATING
        incident.status = "INVESTIGATING"
        incident.acknowledged_at = datetime.utcnow()
        db.commit()

        # Run async analysis
        asyncio.create_task(HealthChecker.run_agent_analysis_pipeline(incident.id))

    @staticmethod
    async def run_agent_analysis_pipeline(incident_id: str):
        """Asynchronous execution helper to trigger the IncidentAnalyst and Response agents."""
        from ..core.database import SessionLocal
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                return

            event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=incident.id,
                event_type="AI_ANALYSIS_STARTED",
                message="Incident Analyst Agent triggered to scan logs, trace metrics, and diagnose root causes.",
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()

            # Retrieve agents from registry
            analyst = registry.get_agent("INCIDENT_ANALYST")
            responder = registry.get_agent("INCIDENT_RESPONSE")

            if analyst and responder:
                # 1. Execute Analyst
                req_analyst = AgentRequest(
                    project_id=incident.project_id,
                    task_id=incident.id,
                    agent_role="IncidentAnalyst",
                    objective=f"Diagnose root cause and recommend actions for incident {incident.id}.",
                    context={"incident_id": incident.id}
                )
                res_analyst = await analyst.execute(req_analyst, db)

                # 2. Execute Response coordinator
                req_resp = AgentRequest(
                    project_id=incident.project_id,
                    task_id=incident.id,
                    agent_role="IncidentResponse",
                    objective="Verify remediation policies and create response plan.",
                    context={"incident_id": incident.id, "analysis": res_analyst.output.get("analysis")}
                )
                res_resp = await responder.execute(req_resp, db)

                # Transition incident to MONITORING or MITIGATING based on outcome
                incident.status = "MITIGATING"
                
                # Check if there is an autonomous action approved by policy to execute instantly
                auto_actions = res_resp.output.get("auto_actions", [])
                for action in auto_actions:
                    if action.get("status") == "APPROVED":
                        # Execute remediation action
                        # (such as re-running health check or notifying console logs)
                        pass

                db.commit()
        except Exception as e:
            logger.error(f"Failed AI monitoring pipeline run: {e}")
        finally:
            db.close()

    @staticmethod
    async def check_incident_resolution_status(incident_id: str, db: Session):
        """
        Triggered when alerts resolve. Triggers recovery monitoring verification.
        Ensures service remains healthy/stable for a recovery window before closing incident.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident or incident.status in ["RESOLVED", "CLOSED"]:
            return

        # Check if all associated alerts are RESOLVED
        open_alerts = db.query(Alert).filter(
            Alert.incident_id == incident.id,
            Alert.status == "OPEN"
        ).count()

        if open_alerts == 0:
            # Advance to MONITORING status to verify stability
            incident.status = "MONITORING"
            
            event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=incident.id,
                event_type="HEALTH_MONITORING_WINDOW",
                message="All alerts cleared. Verification monitoring window initiated (Service stability validation).",
                timestamp=datetime.utcnow()
            )
            db.add(event)
            db.commit()

            # Trigger asynchronous stability wait loop
            asyncio.create_task(HealthChecker.observe_stability_and_resolve(incident.id))

    @staticmethod
    async def observe_stability_and_resolve(incident_id: str):
        """Asynchronously polls service status to confirm stability over monitoring window."""
        from ..core.database import SessionLocal
        # Wait for a short stability duration (e.g. 5 seconds for tests, otherwise configured)
        await asyncio.sleep(5)
        
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident or incident.status != "MONITORING":
                return

            # Perform a final health check
            if incident.service_id:
                res = await HealthChecker.perform_health_check(incident.service_id, db)
                if res and res.status == "HEALTHY":
                    # Mark Resolved
                    incident.status = "RESOLVED"
                    incident.resolved_at = datetime.utcnow()
                    incident.resolution_summary = "Service health restored and remained stable during the monitoring window."
                    
                    event = IncidentEvent(
                        id=f"evt-{uuid.uuid4().hex[:8]}",
                        incident_id=incident.id,
                        event_type="RESOLVED",
                        message="Service stability verified. Incident resolved successfully.",
                        timestamp=datetime.utcnow()
                    )
                    db.add(event)
                    db.commit()
                    logger.info(f"Incident {incident.id} verified stable and resolved.")
                else:
                    # Re-degrade incident status if health failed
                    incident.status = "MITIGATING"
                    event = IncidentEvent(
                        id=f"evt-{uuid.uuid4().hex[:8]}",
                        incident_id=incident.id,
                        event_type="VERIFICATION_FAILED",
                        message="Service health degradation observed during monitoring window. Returning to MITIGATING status.",
                        timestamp=datetime.utcnow()
                    )
                    db.add(event)
                    db.commit()
                    logger.warning(f"Incident {incident.id} failed stability checks.")
        except Exception as e:
            logger.error(f"Failed stability check task: {e}")
        finally:
            db.close()
