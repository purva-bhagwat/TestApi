"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Gauge,
  Percent,
  TrendingUp,
  Zap,
} from "lucide-react";
import { LoadTestMetricsResponse } from "@/types/api";

interface MetricsOverviewProps {
  metrics: LoadTestMetricsResponse;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const successRate =
    metrics.total_requests > 0
      ? Math.round((metrics.successful_requests / metrics.total_requests) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Throughput (RPS) */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>Throughput</span>
            <Zap className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {metrics.rps}
            </span>
            <span className="text-xs text-zinc-400 font-mono">req/sec</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Real-time server throughput under concurrency
          </p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Median Latency (p50) */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Median (p50)</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {metrics.p50_latency_ms !== null && metrics.p50_latency_ms !== undefined
                ? metrics.p50_latency_ms
                : "—"}
            </span>
            <span className="text-xs text-zinc-400 font-mono">ms</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            50% of requests resolved faster than this
          </p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 3: 90th Percentile (p90) */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
            <span>p90 Latency</span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {metrics.p90_latency_ms !== null && metrics.p90_latency_ms !== undefined
                ? metrics.p90_latency_ms
                : "—"}
            </span>
            <span className="text-xs text-zinc-400 font-mono">ms</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            High-percentile response timeline
          </p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 4: 99th Percentile (p99) */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Tail Latency (p99)</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {metrics.p99_latency_ms !== null && metrics.p99_latency_ms !== undefined
                ? metrics.p99_latency_ms
                : "—"}
            </span>
            <span className="text-xs text-zinc-400 font-mono">ms</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Worst 1% tail delay under stress
          </p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Execution Summary Bar: Success/Fail, Min/Max/Avg, Status Distribution */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          {/* Target and method details */}
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-200 border border-zinc-700">
              {metrics.method}
            </span>
            <p className="text-xs font-mono text-zinc-200 truncate max-w-md" title={metrics.url}>
              {metrics.url}
            </p>
          </div>

          {/* Success count vs failure count badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {metrics.successful_requests} / {metrics.total_requests} Passed ({successRate}%)
              </span>
            </div>

            {metrics.failed_requests > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>{metrics.failed_requests} Failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Latency Quick Indicators & Status Code Distribution */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Min, Avg, Max Latency */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 flex items-center justify-around font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Min Latency</span>
              <span className="text-sm font-semibold text-zinc-200">
                {metrics.min_latency_ms !== null && metrics.min_latency_ms !== undefined
                  ? `${metrics.min_latency_ms} ms`
                  : "—"}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Average</span>
              <span className="text-sm font-semibold text-zinc-200">
                {metrics.avg_latency_ms !== null && metrics.avg_latency_ms !== undefined
                  ? `${metrics.avg_latency_ms} ms`
                  : "—"}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Max Latency</span>
              <span className="text-sm font-semibold text-zinc-200">
                {metrics.max_latency_ms !== null && metrics.max_latency_ms !== undefined
                  ? `${metrics.max_latency_ms} ms`
                  : "—"}
              </span>
            </div>
          </div>

          {/* HTTP Status Code Breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase text-zinc-500 whitespace-nowrap mr-1">
              Status Codes:
            </span>
            {metrics.status_code_distribution &&
            Object.keys(metrics.status_code_distribution).length > 0 ? (
              Object.entries(metrics.status_code_distribution).map(
                ([code, count]) => {
                  const isOk = !isNaN(Number(code)) && Number(code) >= 200 && Number(code) < 400;
                  return (
                    <span
                      key={code}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-medium whitespace-nowrap ${
                        isOk
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      <span className="font-bold">{code}:</span>
                      <span>{count}</span>
                    </span>
                  );
                }
              )
            ) : (
              <span className="text-zinc-500 text-xs italic">
                No codes recorded
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverview;
