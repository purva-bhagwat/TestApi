import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx
import numpy as np

from app.schemas.load_test import LoadTestConfigSchema


async def execute_load_test(config: LoadTestConfigSchema) -> Dict[str, Any]:
    """
    Executes a high-concurrency load test against a target URL using httpx.AsyncClient,
    measures latency with precision timers, computes statistical percentiles with numpy,
    and returns a payload matching the LoadTestRun model schema.
    """
    semaphore = asyncio.Semaphore(config.concurrent_users)

    # Pre-process request body
    request_json = None
    request_content = None
    if config.body is not None:
        if isinstance(config.body, dict):
            request_json = config.body
        elif isinstance(config.body, str):
            try:
                request_json = json.loads(config.body)
            except Exception:
                request_content = config.body.encode("utf-8")
        else:
            request_content = str(config.body).encode("utf-8")

    limits = httpx.Limits(
        max_connections=config.concurrent_users + 10,
        max_keepalive_connections=config.concurrent_users,
    )
    timeout = httpx.Timeout(
        timeout=config.timeout_seconds,
        connect=min(5.0, config.timeout_seconds),
    )

    async with httpx.AsyncClient(
        limits=limits,
        timeout=timeout,
        follow_redirects=True,
        verify=False,
    ) as client:

        async def worker(idx: int) -> Tuple[float, str, bool]:
            async with semaphore:
                t0 = time.perf_counter()
                try:
                    kwargs: Dict[str, Any] = {
                        "method": config.method,
                        "url": config.url,
                        "headers": config.headers or {},
                    }
                    if request_json is not None:
                        kwargs["json"] = request_json
                    elif request_content is not None:
                        kwargs["content"] = request_content

                    response = await client.request(**kwargs)
                    dur_ms = (time.perf_counter() - t0) * 1000.0
                    sc = response.status_code
                    is_ok = 200 <= sc < 400
                    return dur_ms, str(sc), is_ok
                except httpx.TimeoutException as exc:
                    dur_ms = (time.perf_counter() - t0) * 1000.0
                    import traceback
                    print(f"\n[LOAD TEST WORKER TIMEOUT]: {type(exc).__name__}: {exc}")
                    traceback.print_exc()
                    return dur_ms, "timeout", False
                except Exception as exc:
                    dur_ms = (time.perf_counter() - t0) * 1000.0
                    import traceback
                    print(f"\n[LOAD TEST WORKER FAILED]: {type(exc).__name__}: {exc}")
                    traceback.print_exc()
                    err_type = type(exc).__name__
                    return dur_ms, f"error: {err_type}", False

        overall_start = time.perf_counter()
        tasks = [worker(i) for i in range(config.total_requests)]
        results = await asyncio.gather(*tasks)
        total_duration = time.perf_counter() - overall_start

    # Aggregate telemetry
    latencies: List[float] = []
    status_distribution: Dict[str, int] = {}
    success_count = 0
    failure_count = 0

    for dur_ms, status_key, is_ok in results:
        latencies.append(dur_ms)
        status_distribution[status_key] = status_distribution.get(status_key, 0) + 1
        if is_ok:
            success_count += 1
        else:
            failure_count += 1

    # Compute percentiles with numpy
    if latencies:
        arr = np.array(latencies, dtype=np.float64)
        avg_latency_ms = round(float(np.mean(arr)), 2)
        min_latency_ms = round(float(np.min(arr)), 2)
        max_latency_ms = round(float(np.max(arr)), 2)
        p50 = round(float(np.percentile(arr, 50)), 2)
        p90 = round(float(np.percentile(arr, 90)), 2)
        p95 = round(float(np.percentile(arr, 95)), 2)
        p99 = round(float(np.percentile(arr, 99)), 2)
    else:
        avg_latency_ms = min_latency_ms = max_latency_ms = None
        p50 = p90 = p95 = p99 = None

    rps = round(success_count / total_duration, 2) if total_duration > 0 else 0.0

    # Enrich status distribution with metadata
    status_distribution_payload: Dict[str, Any] = {
        str(k): int(v) for k, v in status_distribution.items()
    }
    status_distribution_payload["_method"] = config.method
    status_distribution_payload["_status"] = "completed" if failure_count < config.total_requests else "failed"
    status_distribution_payload["_avg_latency_ms"] = avg_latency_ms
    status_distribution_payload["_min_latency_ms"] = min_latency_ms
    status_distribution_payload["_max_latency_ms"] = max_latency_ms
    status_distribution_payload["_rps"] = rps

    return {
        "target_urls": [config.url],
        "concurrency": config.concurrent_users,
        "total_requests": config.total_requests,
        "duration_seconds": round(total_duration, 4),
        "success_count": success_count,
        "failure_count": failure_count,
        "p50_ms": p50,
        "p90_ms": p90,
        "p95_ms": p95,
        "p99_ms": p99,
        "status_distribution": status_distribution_payload,
    }
