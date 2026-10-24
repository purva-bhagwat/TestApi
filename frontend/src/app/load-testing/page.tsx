"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Clock,
  Flame,
  Gauge,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import LatencyChart from "@/components/load-tester/LatencyChart";
import LoadTestConfigPanel from "@/components/load-tester/LoadTestConfigPanel";
import MetricsOverview from "@/components/load-tester/MetricsOverview";
import {
  getHealthStatus,
  getLoadTestHistory,
  HealthCheckResponse,
  startLoadTest,
} from "@/lib/api";
import { LoadTestConfig, LoadTestMetricsResponse } from "@/types/api";

export default function LoadTestingPage() {
  // Backend health status
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Active execution state
  const [activeMetrics, setActiveMetrics] = useState<LoadTestMetricsResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionProgressText, setExecutionProgressText] = useState<string>("");

  // History state
  const [historyRuns, setHistoryRuns] = useState<LoadTestMetricsResponse[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const h = await getHealthStatus();
      setHealth(h);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getLoadTestHistory(20, 0);
      setHistoryRuns(res.items);
      setHistoryTotal(res.total);
    } catch (err) {
      console.warn("Could not load load test history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    loadHistory();
  }, []);

  const handleStartLoadTest = async (config: LoadTestConfig) => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionProgressText(
      `Dispatching ${config.total_requests} requests across ${config.concurrent_users} virtual users...`
    );

    try {
      const result = await startLoadTest(config);
      setActiveMetrics(result);

      // Prepend to history table immediately
      setHistoryRuns((prev) => [
        result,
        ...prev.filter((item) => item.id !== result.id),
      ]);
      setHistoryTotal((prev) => prev + 1);
    } catch (err: any) {
      setExecutionError(
        err?.message ||
          "Load test failed. Verify the backend service is running and accessible."
      );
    } finally {
      setIsExecuting(false);
      setExecutionProgressText("");
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden pb-20">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[1100px] h-[450px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 mb-2">
              <Flame className="h-3.5 w-3.5 text-cyan-400" />
              <span>Concurrent Stress & Performance Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Distributed Load Testing
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Simulate concurrent virtual users, stress target APIs, and compute percentile distributions.
            </p>
          </div>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-3 self-start md:self-center">
            {healthLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Checking gateway...</span>
              </div>
            ) : health ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">Engine Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Backend Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Load Test Config Control Panel */}
        <LoadTestConfigPanel
          onStart={handleStartLoadTest}
          isLoading={isExecuting}
        />

        {/* Live Executing Banner */}
        {isExecuting && (
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Executing Asynchronous Load Test
                </h3>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  {executionProgressText || "Pooling sockets and dispatching batch..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Execution Error Banner */}
        {executionError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-200">
                  Load Run Error
                </h4>
                <p className="mt-1 font-mono">{executionError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Test Analytical Results */}
        {activeMetrics && !isExecuting && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Benchmark Analytics</span>
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                Run ID: {activeMetrics.id}
              </span>
            </div>

            {/* Metrics Overview Cards */}
            <MetricsOverview metrics={activeMetrics} />

            {/* Latency Percentile Chart */}
            <LatencyChart
              minLatency={activeMetrics.min_latency_ms}
              p50Latency={activeMetrics.p50_latency_ms}
              avgLatency={activeMetrics.avg_latency_ms}
              p90Latency={activeMetrics.p90_latency_ms}
              maxLatency={activeMetrics.max_latency_ms}
            />
          </div>
        )}

        {/* Recent Load Runs Table */}
        <div className="pt-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">
                Recent Load Test Sessions
              </h3>
              {historyTotal > 0 && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                  {historyTotal}
                </span>
              )}
            </div>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            {historyLoading && historyRuns.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span>Loading sessions...</span>
              </div>
            ) : historyRuns.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500">
                No load test sessions found. Start a test above to record telemetry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Target URL</th>
                      <th className="px-4 py-3">Volume</th>
                      <th className="px-4 py-3">Throughput</th>
                      <th className="px-4 py-3">p50 Latency</th>
                      <th className="px-4 py-3">Success Rate</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {historyRuns.map((run) => {
                      const successRate =
                        run.total_requests > 0
                          ? Math.round(
                              (run.successful_requests / run.total_requests) *
                                100
                            )
                          : 0;

                      return (
                        <tr
                          key={run.id}
                          className="hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                              {run.method}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-zinc-200 max-w-xs truncate"
                            title={run.url}
                          >
                            {run.url}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                            {run.total_requests} reqs
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-cyan-400 font-semibold">
                            {run.rps} rps
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-indigo-300">
                            {run.p50_latency_ms !== null &&
                            run.p50_latency_ms !== undefined
                              ? `${run.p50_latency_ms} ms`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] ${
                                successRate >= 95
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-amber-400 bg-amber-500/10"
                              }`}
                            >
                              {successRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-500 text-[11px]">
                            {new Date(run.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setActiveMetrics(run);
                                window.scrollTo({ top: 400, behavior: "smooth" });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-sans font-medium text-indigo-400 hover:bg-indigo-500/20 transition"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
