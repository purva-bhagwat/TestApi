import asyncio
from contextlib import asynccontextmanager
import time
from typing import Any, Dict, List
import httpx
import numpy as np

from app.schemas.load_balancer import (
    LoadBalancerConfigSchema,
    LoadBalancerResultSchema,
    ServerMetrics,
    UpstreamServerConfig,
)


class LoadBalancerRouter:
    """
    Thread/async-safe load balancing router supporting:
    - Round-Robin
    - Weighted Round-Robin (Nginx smooth weighted algorithm)
    - Least Connections (dynamic active in-flight worker tracking)
    """

    def __init__(self, servers: List[UpstreamServerConfig], algorithm: str):
        self.all_servers = servers
        self.healthy_servers = [s for s in servers if s.is_healthy]
        if not self.healthy_servers:
            # Fallback to all servers if somehow none is marked healthy
            self.healthy_servers = servers

        self.algorithm = algorithm
        self._lock = asyncio.Lock()

        # Round-robin state
        self._rr_index = 0

        # Weighted round-robin state (smooth Nginx algorithm)
        self._current_weights = {s.url: 0 for s in self.healthy_servers}
        self._total_weight = sum(s.weight for s in self.healthy_servers) or 1

        # Least connections state
        self._active_connections = {s.url: 0 for s in self.healthy_servers}

    async def select_server(self) -> str:
        async with self._lock:
            if self.algorithm == "round_robin":
                selected = self.healthy_servers[self._rr_index % len(self.healthy_servers)]
                self._rr_index += 1
                return selected.url

            elif self.algorithm == "weighted_round_robin":
                # Nginx smooth weighted round-robin
                for s in self.healthy_servers:
                    self._current_weights[s.url] += s.weight

                selected = max(self.healthy_servers, key=lambda s: self._current_weights[s.url])
                self._current_weights[selected.url] -= self._total_weight
                return selected.url

            elif self.algorithm == "least_connections":
                # Find server with minimum active in-flight requests
                selected = min(self.healthy_servers, key=lambda s: self._active_connections[s.url])
                self._active_connections[selected.url] += 1
                return selected.url

            # Default fallback
            selected = self.healthy_servers[self._rr_index % len(self.healthy_servers)]
            self._rr_index += 1
            return selected.url

    async def release_connection(self, server_url: str) -> None:
        if self.algorithm == "least_connections":
            async with self._lock:
                if server_url in self._active_connections:
                    self._active_connections[server_url] = max(
                        0, self._active_connections[server_url] - 1
                    )

    @asynccontextmanager
    async def route_request(self):
        target_url = await self.select_server()
        try:
            yield target_url
        finally:
            await self.release_connection(target_url)


async def execute_load_balanced_test(
    config: LoadBalancerConfigSchema,
) -> Dict[str, Any]:
    """
    Executes a concurrent load test dispatched across upstream servers using
    the selected load balancing algorithm. Returns aggregated distribution metrics.
    """
    router = LoadBalancerRouter(config.servers, config.algorithm)
    semaphore = asyncio.Semaphore(config.concurrent_users)
    stats_lock = asyncio.Lock()

    # Track metrics per upstream server
    server_stats: Dict[str, Dict[str, Any]] = {
        s.url: {
            "url": s.url,
            "total_dispatched": 0,
            "success_count": 0,
            "failure_count": 0,
            "latencies": [],
        }
        for s in config.servers
    }

    limits = httpx.Limits(
        max_connections=config.concurrent_users + 10,
        max_keepalive_connections=config.concurrent_users,
    )
    timeout = httpx.Timeout(
        timeout=config.timeout_seconds,
        connect=min(3.0, config.timeout_seconds),
    )

    async with httpx.AsyncClient(
        limits=limits,
        timeout=timeout,
        follow_redirects=True,
        verify=False,
    ) as client:

        async def worker():
            async with semaphore:
                async with router.route_request() as target_url:
                    t0 = time.perf_counter()
                    is_success = False
                    try:
                        resp = await client.get(target_url)
                        dur_ms = (time.perf_counter() - t0) * 1000.0
                        is_success = 200 <= resp.status_code < 400
                    except Exception:
                        dur_ms = (time.perf_counter() - t0) * 1000.0
                        is_success = False

                    async with stats_lock:
                        st = server_stats[target_url]
                        st["total_dispatched"] += 1
                        if is_success:
                            st["success_count"] += 1
                        else:
                            st["failure_count"] += 1
                        st["latencies"].append(dur_ms)

        overall_start = time.perf_counter()
        tasks = [worker() for _ in range(config.total_requests)]
        await asyncio.gather(*tasks)
        total_duration = time.perf_counter() - overall_start

    # Build per-server metrics
    server_distribution: Dict[str, ServerMetrics] = {}
    total_successful = 0

    for s in config.servers:
        st = server_stats[s.url]
        lats = st["latencies"]
        avg_lat = round(float(np.mean(lats)), 2) if lats else 0.0
        total_successful += st["success_count"]

        server_distribution[s.url] = ServerMetrics(
            url=s.url,
            total_dispatched=st["total_dispatched"],
            success_count=st["success_count"],
            failure_count=st["failure_count"],
            avg_latency_ms=avg_lat,
        )

    overall_rps = (
        round(total_successful / total_duration, 2)
        if total_duration > 0
        else 0.0
    )

    return {
        "algorithm": config.algorithm,
        "total_requests": config.total_requests,
        "total_duration_seconds": round(total_duration, 4),
        "overall_rps": overall_rps,
        "server_distribution": server_distribution,
    }
