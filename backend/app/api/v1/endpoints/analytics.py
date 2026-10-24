import csv
import io
import json
from math import ceil
from typing import Any, Dict, List, Literal, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.load_test_run import LoadTestRun
from app.models.project import Project
from app.models.test_run import TestRun
from app.schemas.analytics import (
    MetricComparison,
    PaginatedHistoryResponse,
    RunComparisonResponse,
    UnifiedHistoryItem,
)

router = APIRouter()


async def _convert_test_run_to_item(tr: TestRun) -> UnifiedHistoryItem:
    is_success = bool(tr.status_code and tr.status_code < 400 and not tr.error_message)
    duration = round(tr.response_time_ms / 1000.0, 3) if tr.response_time_ms else 0.0

    return UnifiedHistoryItem(
        id=str(tr.id),
        test_type="single",
        timestamp=tr.created_at,
        url=tr.url,
        target_urls=[tr.url],
        method=tr.method,
        status="completed" if is_success else "failed",
        status_code=tr.status_code,
        duration_seconds=duration,
        latency_avg_ms=tr.response_time_ms,
        p50_ms=tr.response_time_ms,
        p90_ms=tr.response_time_ms,
        p95_ms=tr.response_time_ms,
        p99_ms=tr.response_time_ms,
        concurrency=1,
        total_requests=1,
        success_count=1 if is_success else 0,
        failure_count=0 if is_success else 1,
        success_rate=100.0 if is_success else 0.0,
        rps=round(1.0 / duration, 2) if duration > 0 else 1.0,
        error_message=tr.error_message,
        metadata={
            "response_headers": tr.response_headers,
            "query_params": tr.query_params,
        },
    )


async def _convert_load_run_to_item(lr: LoadTestRun) -> UnifiedHistoryItem:
    is_balancer = bool(
        (lr.status_distribution and lr.status_distribution.get("_type") == "balancer")
        or (len(lr.target_urls or []) > 1)
    )
    test_type = "balancer" if is_balancer else "load"

    total = lr.total_requests or 1
    success_rate = round((lr.success_count / total) * 100.0, 1)

    return UnifiedHistoryItem(
        id=str(lr.id),
        test_type=test_type,
        timestamp=lr.created_at,
        url=lr.url or (", ".join(lr.target_urls) if lr.target_urls else "http://cluster"),
        target_urls=lr.target_urls,
        method=lr.method,
        status=lr.status,
        status_code=None,
        duration_seconds=lr.duration_seconds,
        latency_avg_ms=lr.avg_latency_ms,
        p50_ms=lr.p50_ms,
        p90_ms=lr.p90_ms,
        p95_ms=lr.p95_ms,
        p99_ms=lr.p99_ms,
        concurrency=lr.concurrency,
        total_requests=lr.total_requests,
        success_count=lr.success_count,
        failure_count=lr.failure_count,
        success_rate=success_rate,
        rps=lr.rps,
        error_message=None,
        metadata=lr.status_distribution,
    )


async def _fetch_filtered_items(
    db: AsyncSession,
    test_type: Optional[str] = None,
    project_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
) -> List[UnifiedHistoryItem]:
    """Fetch and merge test runs across single, load, and balancer execution logs."""
    items: List[UnifiedHistoryItem] = []

    # Resolve project base_url or paths if project_id is given
    project_base_url: Optional[str] = None
    if project_id:
        proj_stmt = select(Project).where(Project.id == project_id)
        proj_res = await db.execute(proj_stmt)
        proj = proj_res.scalar_one_or_none()
        if proj and proj.base_url:
            project_base_url = proj.base_url.strip()

    # 1. Fetch Single Tests if requested or all
    if test_type in (None, "", "all", "single"):
        stmt = select(TestRun).order_by(TestRun.created_at.desc())
        if project_base_url:
            stmt = stmt.where(TestRun.url.ilike(f"%{project_base_url}%"))
        res = await db.execute(stmt)
        for tr in res.scalars().all():
            item = await _convert_test_run_to_item(tr)
            items.append(item)

    # 2. Fetch Load and Balancer Tests if requested or all
    if test_type in (None, "", "all", "load", "balancer"):
        stmt = select(LoadTestRun).order_by(LoadTestRun.created_at.desc())
        res = await db.execute(stmt)
        for lr in res.scalars().all():
            item = await _convert_load_run_to_item(lr)

            # Check test_type filter
            if test_type == "load" and item.test_type != "load":
                continue
            if test_type == "balancer" and item.test_type != "balancer":
                continue

            # Check project base url
            if project_base_url:
                matches_project = any(
                    project_base_url in u for u in (item.target_urls or [item.url])
                )
                if not matches_project:
                    continue

            items.append(item)

    # 3. Sort unified list by timestamp descending
    items.sort(key=lambda x: x.timestamp, reverse=True)

    # 4. Filter by status if specified
    if status_filter:
        s_lower = status_filter.strip().lower()
        if s_lower in ("success", "completed"):
            items = [i for i in items if i.status in ("completed", "success") or (i.failure_count == 0)]
        elif s_lower in ("failed", "error"):
            items = [i for i in items if i.status == "failed" or (i.failure_count and i.failure_count > 0)]

    return items


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get(
    "",
    response_model=PaginatedHistoryResponse,
    summary="List Unified Test Execution History",
    description="Returns a paginated list of historical test logs across Single API, Load Testing, and Load Balancer executions.",
)
@router.get(
    "/history",
    response_model=PaginatedHistoryResponse,
    include_in_schema=False,
)
async def get_unified_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    test_type: Optional[str] = Query(default=None, description="single, load, balancer, or all"),
    project_id: Optional[uuid.UUID] = Query(default=None, description="Filter by workspace project"),
    status: Optional[str] = Query(default=None, description="Filter by status (success, failed)"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedHistoryResponse:
    all_items = await _fetch_filtered_items(
        db, test_type=test_type, project_id=project_id, status_filter=status
    )

    total = len(all_items)
    total_pages = max(1, ceil(total / page_size))
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_items = all_items[start_idx:end_idx]

    return PaginatedHistoryResponse(
        items=paged_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/compare",
    response_model=RunComparisonResponse,
    summary="Compare Two Test Benchmark Runs",
    description="Computes differential performance metrics, delta RPS, percentile differences, and regression/improvement verdicts between Run A and Run B.",
)
@router.get(
    "/history/compare",
    response_model=RunComparisonResponse,
    include_in_schema=False,
)
async def compare_runs(
    run_a_id: uuid.UUID = Query(..., description="Baseline test execution ID"),
    run_b_id: uuid.UUID = Query(..., description="Comparison target test execution ID"),
    db: AsyncSession = Depends(get_db),
) -> RunComparisonResponse:
    # Attempt to locate run A
    run_a_item: Optional[UnifiedHistoryItem] = None
    lr_a = await db.get(LoadTestRun, run_a_id)
    if lr_a:
        run_a_item = await _convert_load_run_to_item(lr_a)
    else:
        tr_a = await db.get(TestRun, run_a_id)
        if tr_a:
            run_a_item = await _convert_test_run_to_item(tr_a)

    if not run_a_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baseline run with ID '{run_a_id}' was not found.",
        )

    # Attempt to locate run B
    run_b_item: Optional[UnifiedHistoryItem] = None
    lr_b = await db.get(LoadTestRun, run_b_id)
    if lr_b:
        run_b_item = await _convert_load_run_to_item(lr_b)
    else:
        tr_b = await db.get(TestRun, run_b_id)
        if tr_b:
            run_b_item = await _convert_test_run_to_item(tr_b)

    if not run_b_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comparison run with ID '{run_b_id}' was not found.",
        )

    # Compute deltas
    rps_a = run_a_item.rps or 0.0
    rps_b = run_b_item.rps or 0.0
    delta_rps = round(rps_b - rps_a, 2)
    pct_rps = round(((rps_b - rps_a) / rps_a) * 100.0, 1) if rps_a > 0 else 0.0

    # P50 Latency
    p50_a = run_a_item.p50_ms or run_a_item.latency_avg_ms
    p50_b = run_b_item.p50_ms or run_b_item.latency_avg_ms
    delta_p50 = round(p50_b - p50_a, 2) if (p50_a is not None and p50_b is not None) else None
    pct_p50 = (
        round(((p50_b - p50_a) / p50_a) * 100.0, 1)
        if (p50_a and p50_b is not None)
        else None
    )

    # P90 Latency
    p90_a = run_a_item.p90_ms
    p90_b = run_b_item.p90_ms
    delta_p90 = round(p90_b - p90_a, 2) if (p90_a is not None and p90_b is not None) else None
    pct_p90 = (
        round(((p90_b - p90_a) / p90_a) * 100.0, 1)
        if (p90_a and p90_b is not None)
        else None
    )

    # P99 Latency
    p99_a = run_a_item.p99_ms
    p99_b = run_b_item.p99_ms
    delta_p99 = round(p99_b - p99_a, 2) if (p99_a is not None and p99_b is not None) else None
    pct_p99 = (
        round(((p99_b - p99_a) / p99_a) * 100.0, 1)
        if (p99_a and p99_b is not None)
        else None
    )

    # Error rates
    err_rate_a = (
        round((run_a_item.failure_count / run_a_item.total_requests) * 100.0, 1)
        if (run_a_item.total_requests and run_a_item.failure_count is not None)
        else 0.0
    )
    err_rate_b = (
        round((run_b_item.failure_count / run_b_item.total_requests) * 100.0, 1)
        if (run_b_item.total_requests and run_b_item.failure_count is not None)
        else 0.0
    )
    delta_err_rate = round(err_rate_b - err_rate_a, 1)

    # Duration
    dur_a = run_a_item.duration_seconds or 0.0
    dur_b = run_b_item.duration_seconds or 0.0
    delta_dur = round(dur_b - dur_a, 2)

    # Verdict synthesis
    verdict: Literal["improved", "regressed", "equivalent"] = "equivalent"
    if pct_rps >= 5.0 and (pct_p50 is None or pct_p50 <= 0):
        verdict = "improved"
    elif pct_p50 is not None and pct_p50 <= -10.0 and pct_rps >= -2.0:
        verdict = "improved"
    elif pct_rps <= -10.0 or (pct_p50 is not None and pct_p50 >= 15.0) or delta_err_rate >= 5.0:
        verdict = "regressed"

    summary_parts = []
    if delta_rps != 0:
        dir_word = "higher" if delta_rps > 0 else "lower"
        summary_parts.append(f"{abs(pct_rps)}% {dir_word} throughput ({delta_rps:+g} RPS)")
    if delta_p50 is not None and delta_p50 != 0:
        lat_word = "faster" if delta_p50 < 0 else "slower"
        summary_parts.append(f"{abs(delta_p50)}ms {lat_word} p50 latency")
    if delta_err_rate != 0:
        summary_parts.append(f"{delta_err_rate:+g}% error rate change")

    summary_text = (
        f"Run B demonstrates {', '.join(summary_parts)}."
        if summary_parts
        else "Both runs demonstrated practically equivalent throughput and latency profiles."
    )

    comparison = MetricComparison(
        delta_rps=delta_rps,
        pct_rps_diff=pct_rps,
        delta_p50_ms=delta_p50,
        pct_p50_diff=pct_p50,
        delta_p90_ms=delta_p90,
        pct_p90_diff=pct_p90,
        delta_p99_ms=delta_p99,
        pct_p99_diff=pct_p99,
        delta_error_rate=delta_err_rate,
        delta_duration_seconds=delta_dur,
        verdict=verdict,
        summary=summary_text,
    )

    return RunComparisonResponse(
        run_a=run_a_item,
        run_b=run_b_item,
        comparison=comparison,
    )


@router.get(
    "/export",
    summary="Export Test History Dataset",
    description="Streams a downloadable report of test execution logs in JSON or CSV format.",
)
@router.get(
    "/history/export",
    include_in_schema=False,
)
async def export_history(
    format: str = Query(default="json", description="Export format: json or csv"),
    test_type: Optional[str] = Query(default=None, description="single, load, balancer"),
    project_id: Optional[uuid.UUID] = Query(default=None, description="Filter by workspace project"),
    db: AsyncSession = Depends(get_db),
):
    items = await _fetch_filtered_items(db, test_type=test_type, project_id=project_id)

    if format.strip().lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        writer.writerow([
            "ID",
            "Test Type",
            "Timestamp",
            "Method",
            "Target URL",
            "Status",
            "Status Code",
            "Concurrency",
            "Total Requests",
            "Duration (s)",
            "Success Count",
            "Failure Count",
            "Success Rate (%)",
            "RPS",
            "Avg Latency (ms)",
            "P50 (ms)",
            "P90 (ms)",
            "P95 (ms)",
            "P99 (ms)",
            "Error Message",
        ])

        for item in items:
            writer.writerow([
                item.id,
                item.test_type,
                item.timestamp.isoformat(),
                item.method,
                item.url,
                item.status,
                item.status_code if item.status_code is not None else "",
                item.concurrency if item.concurrency is not None else "",
                item.total_requests if item.total_requests is not None else "",
                item.duration_seconds if item.duration_seconds is not None else "",
                item.success_count if item.success_count is not None else "",
                item.failure_count if item.failure_count is not None else "",
                item.success_rate if item.success_rate is not None else "",
                item.rps if item.rps is not None else "",
                item.latency_avg_ms if item.latency_avg_ms is not None else "",
                item.p50_ms if item.p50_ms is not None else "",
                item.p90_ms if item.p90_ms is not None else "",
                item.p95_ms if item.p95_ms is not None else "",
                item.p99_ms if item.p99_ms is not None else "",
                item.error_message or "",
            ])

        csv_content = output.getvalue()
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": 'attachment; filename="testapi-report.csv"',
                "Content-Type": "text/csv; charset=utf-8",
            },
        )

    # Default to JSON export
    data = [item.model_dump(mode="json") for item in items]
    json_bytes = json.dumps(data, indent=2).encode("utf-8")
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="testapi-report.json"',
            "Content-Type": "application/json; charset=utf-8",
        },
    )
