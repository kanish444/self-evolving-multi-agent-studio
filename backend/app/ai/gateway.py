import time
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, Type, Any
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import SessionLocal
from ..models.ai_request import AIRequest
from ..models.ai_response import AIResponse
from ..models.log import Log
from .providers.gemini import GeminiProvider

logger = logging.getLogger("app.ai.gateway")

class AIGateway:
    def __init__(self, provider=None):
        if provider:
            self.provider = provider
        else:
            # Initialize provider based on settings config
            if settings.AI_PROVIDER == "gemini":
                self.provider = GeminiProvider(
                    api_key=settings.GEMINI_API_KEY,
                    model=settings.AI_MODEL
                )
            else:
                logger.error(f"Unsupported AI provider configured: {settings.AI_PROVIDER}")
                raise ValueError(f"Unsupported AI Provider: {settings.AI_PROVIDER}")

    async def generate(
        self,
        project_id: str,
        task_type: str,
        prompt: str,
        system_prompt: str,
        agent_role: str = "PM",
        response_schema: Optional[Type[BaseModel]] = None,
        trace_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        iteration_id: Optional[str] = None,
        task_id: Optional[str] = None,
        db_session = None
    ) -> dict:
        """
        Main interface to send requests to LLM.
        Tracks logs, records DB history, validates schema, and returns JSON dict.
        """
        request_id = f"req-{uuid.uuid4().hex[:8]}"
        trace_id = trace_id or f"trace_{uuid.uuid4().hex[:8]}"
        correlation_id = correlation_id or f"corr_{uuid.uuid4().hex[:8]}"
        
        # Open local DB session if none provided
        db = db_session or SessionLocal()
        
        # 1. Log AI Request Started in Application Logs (Phase 8 Observability)
        timestamp_str = datetime.now().strftime("%H:%M:%S")
        log_entry_start = Log(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            iteration_id=iteration_id,
            agent_id=agent_role,
            task_id=task_id,
            type="INFO",
            status="RUNNING",
            action="AI_REQUEST_STARTED",
            message=f"AI Request started ({task_type}) using {settings.AI_PROVIDER}/{settings.AI_MODEL}. Request ID: {request_id}",
            trace_id=trace_id,
            correlation_id=correlation_id,
            timestamp=timestamp_str
        )
        db.add(log_entry_start)
        
        # 2. Persist AIRequest to DB history
        ai_req = AIRequest(
            id=request_id,
            project_id=project_id,
            user_id=None, # System service context
            agent_role=agent_role,
            task_type=task_type,
            prompt=prompt,
            model=settings.AI_MODEL,
            provider=settings.AI_PROVIDER,
            temperature=settings.AI_TEMPERATURE
        )
        db.add(ai_req)
        
        # Commit request state early in case execution fails or hangs
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to persist AIRequest log: {e}")

        # Start timer for latency tracking
        start_time = time.time()
        
        try:
            # 3. Trigger raw LLM provider call
            raw_response = await self.provider.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                response_schema=response_schema,
                temperature=settings.AI_TEMPERATURE,
                max_tokens=settings.AI_MAX_TOKENS,
                timeout=settings.AI_TIMEOUT
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract metadata details from the provider response if attached
            metadata = raw_response.pop("_metadata", {})
            input_tokens = metadata.get("input_tokens", 0)
            output_tokens = metadata.get("output_tokens", 0)
            
            # 4. Enforce Pydantic validation on response
            if response_schema:
                try:
                    # Validate and parse structured response schema
                    validated_obj = response_schema.model_validate(raw_response)
                    structured_data = validated_obj.model_dump()
                except Exception as val_err:
                    logger.error(f"Response validation failed for {response_schema.__name__}: {val_err}")
                    
                    # Log validation error event
                    log_val_fail = Log(
                        id=f"evt-{uuid.uuid4().hex[:8]}",
                        project_id=project_id,
                        iteration_id=iteration_id,
                        agent_id=agent_role,
                        task_id=task_id,
                        type="ERROR",
                        status="FAILED",
                        action="AI_RESPONSE_VALIDATION_FAILED",
                        message=f"Validation failed on model response: {val_err}",
                        trace_id=trace_id,
                        correlation_id=correlation_id,
                        timestamp=datetime.now().strftime("%H:%M:%S")
                    )
                    db.add(log_val_fail)
                    raise ValueError(f"AI response schema validation failed: {val_err}")
            else:
                structured_data = raw_response

            # 5. Persist Successful AIResponse to DB history
            ai_res = AIResponse(
                id=f"res-{uuid.uuid4().hex[:8]}",
                request_id=request_id,
                project_id=project_id,
                agent_role=agent_role,
                content=json.dumps(structured_data),
                structured_data=json.dumps(structured_data),
                model=settings.AI_MODEL,
                provider=settings.AI_PROVIDER,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
                status="SUCCESS",
                error_message=None
            )
            db.add(ai_res)
            
            # Log completion event (Phase 8 Observability)
            log_entry_success = Log(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                project_id=project_id,
                iteration_id=iteration_id,
                agent_id=agent_role,
                task_id=task_id,
                type="SUCCESS",
                status="COMPLETED",
                action="AI_REQUEST_COMPLETED",
                message=f"AI Request completed successfully in {latency_ms}ms. Input tokens: {input_tokens}, Output tokens: {output_tokens}",
                trace_id=trace_id,
                correlation_id=correlation_id,
                timestamp=datetime.now().strftime("%H:%M:%S")
            )
            db.add(log_entry_success)
            
            db.commit()
            return structured_data

        except Exception as e:
            # Handle AI failure case
            latency_ms = int((time.time() - start_time) * 1000)
            error_message = str(e)
            
            # Persist FAILED AIResponse to DB
            try:
                ai_res_fail = AIResponse(
                    id=f"res-{uuid.uuid4().hex[:8]}",
                    request_id=request_id,
                    project_id=project_id,
                    agent_role=agent_role,
                    content=None,
                    structured_data=None,
                    model=settings.AI_MODEL,
                    provider=settings.AI_PROVIDER,
                    input_tokens=0,
                    output_tokens=0,
                    latency_ms=latency_ms,
                    status="FAILED",
                    error_message=error_message
                )
                db.add(ai_res_fail)
                
                # Log execution failed event
                log_entry_fail = Log(
                    id=f"evt-{uuid.uuid4().hex[:8]}",
                    project_id=project_id,
                    iteration_id=iteration_id,
                    agent_id=agent_role,
                    task_id=task_id,
                    type="ERROR",
                    status="FAILED",
                    action="AI_REQUEST_FAILED",
                    message=f"AI Request failed: {error_message}",
                    trace_id=trace_id,
                    correlation_id=correlation_id,
                    timestamp=datetime.now().strftime("%H:%M:%S")
                )
                db.add(log_entry_fail)
                db.commit()
            except Exception as db_err:
                logger.error(f"Failed to record failed response state in DB: {db_err}")
            
            # Re-raise error to propagate standard REST messages
            raise e
        finally:
            if db_session is None:
                db.close()
