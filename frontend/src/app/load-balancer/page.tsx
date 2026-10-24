"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Cpu,
  Flame,
  Layers,
  Loader2,
  Network,
  RotateCcw,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";
import ClusterAnalytics from "@/components/load-balancer/ClusterAnalytics";
import ServerClusterConfig from "@/components/load-balancer/ServerClusterConfig";
import { simulateLoadBalancer } from "@/lib/api";
import { LoadBalancerConfig, LoadBalancerResult } from "@/types/api";

export default function LoadBalancerPage() {
  const [simulationResult, setSimulationResult] = useState<LoadBalancerResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const handleSimulate = async (config: LoadBalancerConfig) => {
    setIsSimulating(true);
    setSimulationError(null);

    try {
      const result = await simulateLoadBalancer(config);
      setSimulationResult(result);
    } catch (err: any) {
      setSimulationError(
        err?.message ||
          "Failed to execute load balancer simulation. Ensure the FastAPI backend is running."
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden pb-20">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[1100px] h-[450px] bg-gradient-to-b from-amber-600/10 via-orange-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 mb-2">
              <Network className="h-3.5 w-3.5 text-amber-400" />
              <span>Reverse Proxy & Traffic Router Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Load Balancer Simulator
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Test and analyze traffic distribution algorithms (Round-Robin, Weighted, Least Connections) across upstream clusters.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Router Engine Active</span>
          </div>
        </div>

        {/* Cluster Configuration Panel */}
        <ServerClusterConfig
          onSimulate={handleSimulate}
          isLoading={isSimulating}
        />

        {/* Live Simulation Banner */}
        {isSimulating && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Routing Traffic Across Cluster
                </h3>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  Evaluating load balancer policy and capturing latency per node...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Error Alert */}
        {simulationError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-200">
                  Simulation Error
                </h4>
                <p className="mt-1 font-mono">{simulationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Output Dashboard */}
        {simulationResult && !isSimulating && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Simulation Telemetry</span>
              </h2>
            </div>

            <ClusterAnalytics result={simulationResult} />
          </div>
        )}

        {/* Architecture & Educational Reference */}
        <div className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Routing Algorithms Under the Hood
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
                <span>Round-Robin</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Rotates tasks sequentially across all servers. Ideal when servers share uniform CPU/RAM capacity and requests consume equivalent processing cycles.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
                <span>Weighted Round-Robin</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Proportionally weights server capacity (e.g. 5:2:1). Leverages Nginx-style smooth interleaving to avoid burst clustering on higher-weighted nodes.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
                <span>Least Connections</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Dynamically tracks concurrent in-flight connections per node. Routes incoming requests to the server with the lowest active workload.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
