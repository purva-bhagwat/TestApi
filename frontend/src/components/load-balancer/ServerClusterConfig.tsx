"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Loader2,
  Network,
  Play,
  Plus,
  Server,
  Sliders,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { LoadBalancerConfig, UpstreamServer } from "@/types/api";

interface ServerClusterConfigProps {
  onSimulate: (config: LoadBalancerConfig) => void;
  isLoading: boolean;
}

const ALGORITHMS: {
  id: "round_robin" | "weighted_round_robin" | "least_connections";
  label: string;
  description: string;
}[] = [
  {
    id: "round_robin",
    label: "Round-Robin",
    description: "Evenly alternates requests sequentially across all active upstream servers.",
  },
  {
    id: "weighted_round_robin",
    label: "Weighted Round-Robin",
    description: "Proportionally distributes traffic according to server performance capacity weights.",
  },
  {
    id: "least_connections",
    label: "Least Connections",
    description: "Dynamically routes incoming requests to the server with the fewest active connections.",
  },
];

export const ServerClusterConfig: React.FC<ServerClusterConfigProps> = ({
  onSimulate,
  isLoading,
}) => {
  const [algorithm, setAlgorithm] = useState<
    "round_robin" | "weighted_round_robin" | "least_connections"
  >("weighted_round_robin");

  const [servers, setServers] = useState<UpstreamServer[]>([
    { url: "https://httpbin.org/get?node=cluster-alpha", weight: 3, is_healthy: true },
    { url: "https://postman-echo.com/get?node=cluster-beta", weight: 2, is_healthy: true },
    { url: "https://httpbin.org/get?node=cluster-gamma", weight: 1, is_healthy: true },
  ]);

  const [concurrentUsers, setConcurrentUsers] = useState<number>(10);
  const [totalRequests, setTotalRequests] = useState<number>(40);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(5);

  const handleAddServer = () => {
    if (servers.length >= 6) return;
    setServers((prev) => [
      ...prev,
      {
        url: `https://httpbin.org/get?node=cluster-${String.fromCharCode(
          97 + prev.length
        )}`,
        weight: 1,
        is_healthy: true,
      },
    ]);
  };

  const handleRemoveServer = (index: number) => {
    if (servers.length <= 2) return;
    setServers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateServer = (
    index: number,
    field: keyof UpstreamServer,
    val: any
  ) => {
    setServers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const applyPreset = (presetType: "equal" | "weighted" | "failover") => {
    if (presetType === "equal") {
      setAlgorithm("round_robin");
      setServers([
        { url: "https://httpbin.org/get?node=server-1", weight: 1, is_healthy: true },
        { url: "https://postman-echo.com/get?node=server-2", weight: 1, is_healthy: true },
        { url: "https://httpbin.org/get?node=server-3", weight: 1, is_healthy: true },
      ]);
      setTotalRequests(30);
    } else if (presetType === "weighted") {
      setAlgorithm("weighted_round_robin");
      setServers([
        { url: "https://httpbin.org/get?node=high-capacity-1", weight: 5, is_healthy: true },
        { url: "https://postman-echo.com/get?node=standard-2", weight: 2, is_healthy: true },
        { url: "https://httpbin.org/get?node=economy-3", weight: 1, is_healthy: true },
      ]);
      setTotalRequests(40);
    } else if (presetType === "failover") {
      setAlgorithm("least_connections");
      setServers([
        { url: "https://httpbin.org/get?node=primary-active", weight: 2, is_healthy: true },
        { url: "https://httpbin.org/get?node=secondary-active", weight: 1, is_healthy: true },
        { url: "https://offline.internal.mesh:9999", weight: 1, is_healthy: false },
      ]);
      setTotalRequests(25);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const healthyCount = servers.filter((s) => s.is_healthy).length;
    if (healthyCount === 0) {
      alert("At least one server must be marked healthy to simulate traffic.");
      return;
    }

    onSimulate({
      servers,
      algorithm,
      concurrent_users: concurrentUsers,
      total_requests: totalRequests,
      timeout_seconds: timeoutSeconds,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Cluster Configuration</h2>
            <p className="text-[11px] text-zinc-400">Configure upstream nodes and routing strategy</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset("equal")}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Equal (RR)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("weighted")}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Weighted (5:2:1)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("failover")}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Failover Test
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Algorithm Selector Buttons */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Load Balancing Algorithm
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ALGORITHMS.map((algo) => {
              const isSelected = algorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => setAlgorithm(algo.id)}
                  className={`flex flex-col text-left rounded-xl border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-amber-400" : "text-zinc-200"
                      }`}
                    >
                      {algo.label}
                    </span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {algo.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upstream Server Rows List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 px-1">
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-zinc-400" />
              <span>Upstream Targets ({servers.length}/6)</span>
            </span>

            {servers.length < 6 && (
              <button
                type="button"
                onClick={handleAddServer}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Upstream Server</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {servers.map((srv, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-2.5 transition"
              >
                {/* Node Identifier */}
                <div className="flex items-center gap-2 min-w-[70px]">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-400">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateServer(idx, "is_healthy", !srv.is_healthy)
                    }
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold transition border ${
                      srv.is_healthy
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    }`}
                    title="Click to toggle health status"
                  >
                    {srv.is_healthy ? "HEALTHY" : "DOWN"}
                  </button>
                </div>

                {/* Target URL */}
                <input
                  type="text"
                  value={srv.url}
                  onChange={(e) =>
                    handleUpdateServer(idx, "url", e.target.value)
                  }
                  placeholder="https://server-endpoint.com/api"
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
                />

                {/* Weight Control */}
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800 min-w-[130px]">
                  <span className="text-[10px] text-zinc-400">Weight:</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    disabled={algorithm !== "weighted_round_robin"}
                    value={srv.weight}
                    onChange={(e) =>
                      handleUpdateServer(idx, "weight", Number(e.target.value))
                    }
                    className="w-16 accent-amber-500 disabled:opacity-30 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-xs text-amber-400 w-4 text-right">
                    {srv.weight}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={servers.length <= 2}
                  onClick={() => handleRemoveServer(idx)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition disabled:opacity-20 disabled:hover:text-zinc-500 self-end sm:self-center"
                  title={
                    servers.length <= 2
                      ? "Minimum 2 servers required"
                      : "Remove server"
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Volume & Virtual Users Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Concurrency (VUs) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span>Concurrency (VUs)</span>
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {concurrentUsers}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={concurrentUsers}
              onChange={(e) => setConcurrentUsers(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>1 VU</span>
              <span>25 VUs</span>
              <span>50 VUs</span>
            </div>
          </div>

          {/* Total Requests */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>Total Traffic Volume</span>
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {totalRequests}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={totalRequests}
              onChange={(e) => setTotalRequests(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>10 reqs</span>
              <span>100 reqs</span>
              <span>200 reqs</span>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dispatching Simulated Traffic Across Cluster...</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                <span>Simulate Cluster Traffic</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServerClusterConfig;
