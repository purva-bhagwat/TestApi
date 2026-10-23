"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { SingleTestResponse } from "@/types/api";

interface HistoryDrawerProps {
  history: SingleTestResponse[];
  total: number;
  isLoading: boolean;
  selectedRunId?: string;
  onSelectRun: (run: SingleTestResponse) => void;
  onRefresh: () => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  POST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  total,
  isLoading,
  selectedRunId,
  onSelectRun,
  onRefresh,
  onClear,
  isOpen,
  onClose,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 5) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  const getStatusPill = (status?: number, error?: string) => {
    if (error && !status) {
      return (
        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-400 border border-rose-500/20">
          ERR
        </span>
      );
    }
    if (!status) return null;

    if (status >= 200 && status < 300) {
      return (
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
          {status}
        </span>
      );
    }
    if (status >= 400 && status < 500) {
      return (
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-amber-400 border border-amber-500/20">
          {status}
        </span>
      );
    }
    return (
      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-400 border border-rose-500/20">
        {status}
      </span>
    );
  };

  const historyItems = Array.isArray(history) ? history : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Test History</h3>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                {total}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Click any run to replay</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          {/* Clear History Trigger */}
          {history.length > 0 && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
              title="Clear all history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {/* Close Drawer Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            title="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Banner */}
      {showClearConfirm && (
        <div className="flex items-center justify-between bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
          <span>Delete all {total} recorded test runs?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClear();
                setShowClearConfirm(false);
              }}
              className="rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 transition"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            <p className="text-xs text-zinc-400">Loading history records...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <History className="h-8 w-8 text-zinc-600 mb-2" />
            <h4 className="text-xs font-semibold text-zinc-300">
              No Test History
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Execute API runs from the Request Builder to automatically track and inspect historical telemetry.
            </p>
          </div>
        ) : (
          historyItems.map((run) => {
            const isSelected = run.id === selectedRunId;
            const methodColor =
              METHOD_COLORS[run.method.toUpperCase()] ||
              "text-zinc-400 bg-zinc-800";

            return (
              <div
                key={run.id}
                onClick={() => onSelectRun(run)}
                className={`group relative flex flex-col gap-1.5 rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-500/60 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
                    : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                }`}
              >
                {/* Method, Status & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${methodColor}`}
                    >
                      {run.method}
                    </span>
                    {getStatusPill(run.status_code, run.error_message)}
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    {formatRelativeTime(run.created_at)}
                  </span>
                </div>

                {/* Truncated Target URL */}
                <p className="text-xs font-mono text-zinc-200 truncate pr-6" title={run.url}>
                  {run.url}
                </p>

                {/* Footer: Latency & Replay prompt */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 border-t border-zinc-800/50">
                  <span className="flex items-center gap-1 font-mono text-zinc-400">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span>
                      {run.response_time_ms !== undefined && run.response_time_ms !== null
                        ? `${run.response_time_ms} ms`
                        : "N/A"}
                    </span>
                  </span>

                  <span className="flex items-center gap-1 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RotateCcw className="h-3 w-3" />
                    <span>Replay</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="border-t border-zinc-800 p-3 text-center text-[11px] text-zinc-500 font-mono">
        Showing latest {history.length} of {total} runs
      </div>
    </div>
  );
};

export default HistoryDrawer;
