"use client";

import React from "react";
import { BarChart3, Clock, TrendingUp } from "lucide-react";

interface LatencyChartProps {
  minLatency?: number | null;
  p50Latency?: number | null;
  avgLatency?: number | null;
  p90Latency?: number | null;
  maxLatency?: number | null;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({
  minLatency = 0,
  p50Latency = 0,
  avgLatency = 0,
  p90Latency = 0,
  maxLatency = 0,
}) => {
  const safeMin = minLatency || 0;
  const safeP50 = p50Latency || 0;
  const safeAvg = avgLatency || 0;
  const safeP90 = p90Latency || 0;
  const safeMax = Math.max(maxLatency || 0, safeP90, safeAvg, 1);

  const bars = [
    {
      label: "Min",
      sublabel: "Best Case",
      value: safeMin,
      color: "from-emerald-500 to-teal-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    },
    {
      label: "p50",
      sublabel: "Median",
      value: safeP50,
      color: "from-cyan-500 to-sky-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    },
    {
      label: "Average",
      sublabel: "Mean Latency",
      value: safeAvg,
      color: "from-indigo-500 to-violet-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
    },
    {
      label: "p90",
      sublabel: "High Percentile",
      value: safeP90,
      color: "from-purple-500 to-fuchsia-400",
      bgColor: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    },
    {
      label: "Max",
      sublabel: "Worst Case",
      value: maxLatency || 0,
      color: "from-amber-500 to-rose-400",
      bgColor: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Latency Distribution Percentiles
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span>Scale: 0 ms — {safeMax} ms</span>
        </span>
      </div>

      {/* Comparative Horizontal Bar Visualizer */}
      <div className="mt-5 space-y-4">
        {bars.map((bar) => {
          const widthPercent = Math.max(
            Math.round((bar.value / safeMax) * 100),
            bar.value > 0 ? 3 : 0
          );

          return (
            <div key={bar.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${bar.bgColor}`}
                  >
                    {bar.label}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {bar.sublabel}
                  </span>
                </div>
                <span className="font-mono font-semibold text-zinc-100">
                  {bar.value.toFixed(1)} ms
                </span>
              </div>

              {/* Bar track */}
              <div className="relative h-4 w-full rounded-full bg-zinc-950 border border-zinc-800/80 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-700 ease-out`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Percentile Legend */}
      <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>Min (0%)</span>
        <span>p50 (50%)</span>
        <span>Average</span>
        <span>p90 (90%)</span>
        <span>Max (100%)</span>
      </div>
    </div>
  );
};

export default LatencyChart;
