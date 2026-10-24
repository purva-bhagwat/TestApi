"use client";

import React from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Network,
  Server,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { LoadBalancerResult } from "@/types/api";

interface ClusterAnalyticsProps {
  result: LoadBalancerResult;
}

export const ClusterAnalytics: React.FC<ClusterAnalyticsProps> = ({ result }) => {
  const serversList = Object.values(result.server_distribution || {});

  // Identify top server handling the most load
  const maxDispatched = Math.max(
    ...serversList.map((s) => s.total_dispatched),
    1
  );

  const totalSuccess = serversList.reduce((acc, s) => acc + s.success_count, 0);
  const totalFailure = serversList.reduce((acc, s) => acc + s.failure_count, 0);

  const formatAlgorithmName = (algo: string) => {
    if (algo === "weighted_round_robin") return "Weighted Round-Robin";
    if (algo === "least_connections") return "Least Connections";
    return "Round-Robin";
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Algorithm */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Active Algorithm</span>
            <Network className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold tracking-tight text-white font-sans">
              {formatAlgorithmName(result.algorithm)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Routing policy used to balance batch
          </p>
        </div>

        {/* Card 2: Cluster Throughput */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>Aggregated RPS</span>
            <Zap className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {result.overall_rps}
            </span>
            <span className="text-xs text-zinc-400 font-mono">req/s</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Combined throughput across cluster
          </p>
        </div>

        {/* Card 3: Execution Duration */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Total Duration</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {result.total_duration_seconds}
            </span>
            <span className="text-xs text-zinc-400 font-mono">seconds</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Time elapsed for {result.total_requests} requests
          </p>
        </div>

        {/* Card 4: Pass / Fail Rates */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Cluster Status</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-bold text-emerald-400">
              {totalSuccess} OK
            </span>
            {totalFailure > 0 && (
              <span className="text-sm font-semibold text-rose-400">
                / {totalFailure} Err
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {Math.round((totalSuccess / (result.total_requests || 1)) * 100)}% successful delivery
          </p>
        </div>
      </div>

      {/* Per-Server Load Distribution Breakdown */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Server className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Upstream Node Traffic Allocation
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {serversList.length} Nodes Registered
          </span>
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {serversList.map((srv, index) => {
            const sharePercent =
              result.total_requests > 0
                ? Math.round((srv.total_dispatched / result.total_requests) * 100)
                : 0;
            const isTopHandler =
              srv.total_dispatched > 0 && srv.total_dispatched === maxDispatched;

            return (
              <div
                key={srv.url || index}
                className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isTopHandler
                    ? "border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/5"
                    : "border-zinc-800 bg-zinc-950/60"
                }`}
              >
                {/* Top Badge & Node URL */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-300">
                      Node #{index + 1}
                    </span>

                    {isTopHandler && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        <Award className="h-3 w-3" />
                        <span>Top Handler</span>
                      </span>
                    )}
                  </div>

                  <p
                    className="text-xs font-mono text-zinc-200 truncate font-medium mb-3"
                    title={srv.url}
                  >
                    {srv.url}
                  </p>
                </div>

                {/* Progress bar of traffic share */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Share of Traffic:</span>
                    <span className="text-amber-400 font-bold">
                      {sharePercent}% ({srv.total_dispatched} reqs)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/80 text-xs font-mono">
                  <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Deliveries</span>
                    <span className="text-emerald-400 font-semibold">
                      {srv.success_count} OK
                    </span>
                    {srv.failure_count > 0 && (
                      <span className="text-rose-400 text-[10px] block">
                        {srv.failure_count} Err
                      </span>
                    )}
                  </div>

                  <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Avg Latency</span>
                    <span className="text-zinc-200 font-semibold">
                      {srv.avg_latency_ms} ms
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClusterAnalytics;
