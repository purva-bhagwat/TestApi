import json
import time
from typing import Any, Dict, Optional
import httpx

from app.schemas.test_run import TestRunCreateSchema


async def execute_single_request(payload: TestRunCreateSchema) -> Dict[str, Any]:
    """
    Executes a single HTTP request using httpx.AsyncClient, measures latency,
    handles errors gracefully, and returns a dictionary matching the TestRun model fields.
    """
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    response_headers: Optional[Dict[str, Any]] = None
    response_body: Optional[str] = None
    error_message: Optional[str] = None

    # Resolve body representation for storage and dispatch
    request_content = None
    request_json = None
    body_for_db: Optional[str] = None

    if payload.body is not None:
        if isinstance(payload.body, dict):
            request_json = payload.body
            body_for_db = json.dumps(payload.body)
        elif isinstance(payload.body, str):
            request_content = payload.body.encode("utf-8")
            body_for_db = payload.body
        else:
            body_for_db = str(payload.body)
            request_content = body_for_db.encode("utf-8")

    # Configure client timeout
    timeout_config = httpx.Timeout(
        timeout=payload.timeout_seconds,
        connect=min(10.0, payload.timeout_seconds),
    )

    start_time = time.perf_counter()

    try:
        async with httpx.AsyncClient(
            timeout=timeout_config,
            follow_redirects=True,
            verify=False,
        ) as client:
            request_kwargs: Dict[str, Any] = {
                "method": payload.method,
                "url": payload.url,
                "headers": payload.headers or {},
                "params": payload.query_params or {},
            }

            if request_json is not None:
                request_kwargs["json"] = request_json
            elif request_content is not None:
                request_kwargs["content"] = request_content

            response = await client.request(**request_kwargs)

            # Calculate round-trip duration in ms
            response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            status_code = response.status_code
            response_headers = dict(response.headers)
            response_body = response.text

    except httpx.TimeoutException as exc:
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        error_message = f"Request timed out after {payload.timeout_seconds}s: {str(exc) or 'Timeout'}"

    except httpx.RequestError as exc:
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        error_message = f"Network or request error: {str(exc)}"

    except Exception as exc:
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        error_message = f"Unexpected execution error: {type(exc).__name__}: {str(exc)}"

    return {
        "url": payload.url,
        "method": payload.method,
        "headers": payload.headers,
        "query_params": payload.query_params,
        "body": body_for_db,
        "status_code": status_code,
        "response_time_ms": response_time_ms,
        "response_headers": response_headers,
        "response_body": response_body,
        "error_message": error_message,
    }
