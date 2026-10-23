"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  History,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { clearTestHistory, getTestHistory } from "@/lib/api";
import { SingleTestResponse } from "@/types/api";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  POST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<SingleTestResponse[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const rawData: any = await getTestHistory(100, 0);
      const historyItems = Array.isArray(rawData) ? rawData : (rawData.items || []);
      const totalCount = typeof rawData.total === "number" ? rawData.total : historyItems.length;
      setHistory(historyItems);
      setTotal(totalCount);
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearTestHistory();
      setHistory([]);
      setTotal(0);
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(
    (item) =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Console</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Execution History
            </h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-indigo-400 border border-indigo-500/20">
              {total} Total Runs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {history.length > 0 && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-300">
          <span>Are you sure you want to permanently delete all {total} records?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500 transition"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 font-medium text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by endpoint URL or method..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500"
        />
      </div>

      {/* History Table */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mb-2" />
            <span>Loading records from PostgreSQL...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-xs">
            No execution history found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint URL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredHistory.map((run) => {
                  const methodClass =
                    METHOD_COLORS[run.method.toUpperCase()] ||
                    "text-zinc-400 bg-zinc-800";
                  return (
                    <tr
                      key={run.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${methodClass}`}
                        >
                          {run.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-200 max-w-md truncate">
                        {run.url}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {run.status_code ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              run.status_code < 400
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {run.status_code}
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[10px]">ERR</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                        {run.response_time_ms ? `${run.response_time_ms} ms` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-400 text-[11px]">
                        {new Date(run.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href="/"
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-sans font-medium text-indigo-400 hover:bg-indigo-500/20 transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Replay</span>
                        </Link>
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
  );
}
