import asyncio
import logging
import httpx
from typing import Optional, Any, Type, Dict
from pydantic import BaseModel
from .base import AIProvider

logger = logging.getLogger("app.ai.gemini")

def flatten_schema(schema: dict) -> dict:
    """
    Recursively dereference and flatten Pydantic schemas by replacing 
    $ref references with inline schemas. Gemini API works best with flattened schemas.
    """
    if not isinstance(schema, dict):
        return schema
    
    defs = schema.pop("$defs", {}) or schema.pop("definitions", {})
    
    def resolve(node):
        if isinstance(node, dict):
            if "$ref" in node:
                ref_path = node["$ref"]
                ref_key = ref_path.split("/")[-1]
                if ref_key in defs:
                    resolved = resolve(defs[ref_key])
                    # Merge properties keeping non-$ref items
                    for k, v in node.items():
                        if k != "$ref":
                            resolved[k] = v
                    return resolved
            return {k: resolve(v) for k, v in node.items()}
        elif isinstance(node, list):
            return [resolve(item) for item in node]
        return node
        
    return resolve(schema)


class IncompleteResponseError(ValueError):
    """Raised when the AI model response was truncated, interrupted, or cut off."""
    def __init__(self, message: str, finish_reason: Optional[str] = None, output_tokens: int = 0, raw_text: str = ""):
        super().__init__(message)
        self.finish_reason = finish_reason
        self.output_tokens = output_tokens
        self.raw_text = raw_text


class GeminiProvider(AIProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.2,
        max_tokens: int = 65536,
        timeout: float = 180.0
    ) -> dict:
        """Generate real provider output, or fail explicitly. No simulation fallback."""
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured; no AI request was executed.")

        # Flatten the schema if provided
        generation_config: Dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }

        if response_schema:
            raw_schema = response_schema.model_json_schema()
            flat_schema = flatten_schema(raw_schema)
            generation_config["responseMimeType"] = "application/json"
            generation_config["responseSchema"] = flat_schema

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {"text": system_prompt}
                ]
            },
            "generationConfig": generation_config
        }

        url = self.endpoint_url
        
        # Implement exponential backoff retry mechanism (max 3 retries)
        retries = 3
        backoff = 1.0
        
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url,
                        json=payload,
                        headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
                        timeout=timeout
                    )
                
                # Check status and handle rate limit (429) or gateway errors (503/504)
                if response.status_code == 429 or response.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"Transient error: Status code {response.status_code}",
                        request=response.request,
                        response=response
                    )
                
                response.raise_for_status()
                result_json = response.json()
                
                # Parse output and extract token tracking metadata
                candidates = result_json.get("candidates", [])
                if not candidates:
                    raise ValueError("Empty response received from Gemini API.")
                
                candidate = candidates[0]
                finish_reason = candidate.get("finishReason")
                text_content = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
                usage_metadata = result_json.get("usageMetadata", {})
                
                # Attach token metadata to the response
                input_tokens = usage_metadata.get("promptTokenCount", 0)
                output_tokens = usage_metadata.get("candidatesTokenCount", 0)
                
                # Detect incomplete responses before attempting to parse or accept
                if finish_reason == "MAX_TOKENS":
                    logger.warning("Gemini output reached MAX_TOKENS limit (%s tokens).", output_tokens)
                    raise IncompleteResponseError(
                        f"AI model output reached maximum token limit ({output_tokens} tokens) and was truncated. (finishReason: {finish_reason})",
                        finish_reason=finish_reason,
                        output_tokens=output_tokens,
                        raw_text=text_content
                    )
                if finish_reason not in (None, "", "STOP"):
                    logger.warning("Gemini output stopped prematurely with finishReason=%s.", finish_reason)
                    raise IncompleteResponseError(
                        f"AI model stopped prematurely with finishReason={finish_reason} ({output_tokens} tokens).",
                        finish_reason=finish_reason,
                        output_tokens=output_tokens,
                        raw_text=text_content
                    )
                
                import json
                try:
                    parsed_response = json.loads(text_content)
                except json.JSONDecodeError as decode_err:
                    # Strip standard markdown code block formatting if present, but never slice braces or append quotes
                    cleaned = text_content.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    elif cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()
                    try:
                        parsed_response = json.loads(cleaned)
                    except json.JSONDecodeError:
                        raise IncompleteResponseError(
                            f"AI provider returned malformed or truncated JSON: {decode_err} (finishReason: {finish_reason}, outputTokens: {output_tokens})",
                            finish_reason=finish_reason,
                            output_tokens=output_tokens,
                            raw_text=text_content
                        ) from decode_err
                
                # Validate response schema if provided
                if response_schema:
                    try:
                        validated = response_schema.model_validate(parsed_response)
                        parsed_response = validated.model_dump()
                    except Exception as val_err:
                        raise IncompleteResponseError(
                            f"AI provider response failed schema validation: {val_err}",
                            finish_reason=finish_reason,
                            output_tokens=output_tokens,
                            raw_text=text_content
                        ) from val_err
                
                # Inject token details so the Gateway can log them
                parsed_response["_metadata"] = {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "finish_reason": finish_reason,
                    "model": self.model,
                    "provider": "gemini"
                }
                
                return parsed_response

            except (httpx.HTTPStatusError, httpx.RequestError, asyncio.TimeoutError) as e:
                logger.warning("Gemini request failed on attempt %s (%s)", attempt + 1, type(e).__name__)
                if attempt == retries - 1:
                    logger.error("All retries exhausted for Gemini API request.")
                    raise RuntimeError("Gemini request failed after retries; check model, credentials, quota and connectivity.") from None
                await asyncio.sleep(backoff)
                backoff *= 2.0
            except Exception as e:
                logger.error("Gemini response failed (%s)", type(e).__name__)
                raise e

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
        timeout: float = 60.0
    ) -> str:
        """Generate unstructured conversational or markdown text directly."""
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured; no AI request was executed.")
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens
            }
        }
        for attempt in range(3):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.endpoint_url,
                        json=payload,
                        headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
                        timeout=timeout
                    )
                if response.status_code == 429 or response.status_code >= 500:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                response.raise_for_status()
                res_json = response.json()
                candidates = res_json.get("candidates", [])
                if not candidates:
                    raise ValueError("Empty response received from Gemini API.")
                return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            except Exception as err:
                if attempt == 2:
                    raise err
                await asyncio.sleep(1.0 * (attempt + 1))
        return ""

    async def health_check(self) -> dict:
        """
        Check if Gemini is configured and accessible.
        """
        if not self.api_key or not self.model:
            return {
                "status": "warning",
                "message": "Configure GEMINI_API_KEY and AI_MODEL. Live AI requests are blocked.",
                "provider": "gemini",
                "model": self.model
            }
        
        # Quick check call to list models or check key validity
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers={"x-goog-api-key": self.api_key}, timeout=5.0)
            if response.status_code == 200:
                return {
                    "status": "ok",
                    "message": "Gemini API connection healthy.",
                    "provider": "gemini",
                    "model": self.model
                }
            else:
                return {
                    "status": "error",
                    "message": f"Gemini API returned status code {response.status_code}.",
                    "provider": "gemini",
                    "model": self.model
                }
        except Exception as e:
            return {
                "status": "error",
                "message": "Could not reach Gemini; check network connectivity and provider configuration.",
                "provider": "gemini",
                "model": self.model
            }
