"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  FolderKanban,
  Gauge,
  History,
  Layers,
  Network,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  clearTestHistory,
  compareRuns,
  getExportUrl,
  getUnifiedHistory,
} from "@/lib/api";
import {
  MetricComparison,
  PaginatedHistoryResponse,
  RunComparisonResponse,
  UnifiedHistoryItem,
} from "@/types/api";

const TYPE_CONFIG = {
  single: {
    label: "Single Test",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    icon: Zap,
  },
  load: {
    label: "Load Test",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: Flame,
  },
  balancer: {
    label: "Load Balancer",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Network,
  },
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  POST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function HistoryAnalyticsPage() {
  const { projects, activeProject } = useWorkspace();

  // Dataset State
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.id || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Comparison State
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<RunComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState<boolean>(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Details Drawer State
  const [inspectedItem, setInspectedItem] = useState<UnifiedHistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Sync selectedProjectId when activeProject changes from Navbar
  useEffect(() => {
    if (activeProject) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject]);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const res = await getUnifiedHistory({
        page,
        page_size: pageSize,
        test_type: selectedType !== "all" ? selectedType : undefined,
        project_id: selectedProjectId !== "all" ? selectedProjectId : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.warn("Failed to fetch unified history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [page, pageSize, selectedType, selectedProjectId, statusFilter]);

  // Handle run selection for comparison
  const handleToggleSelectRun = (id: string) => {
    setSelectedRunIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rId) => rId !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  // Trigger comparison calculation
  const handleCompareSelected = async () => {
    if (selectedRunIds.length !== 2) return;
    setIsComparing(true);
    setComparisonError(null);
    setComparisonModalOpen(true);

    try {
      const result = await compareRuns(selectedRunIds[0], selectedRunIds[1]);
      setComparisonData(result);
    } catch (err: any) {
      setComparisonError(
        err?.message || "Failed to compare benchmark runs. Verify runs exist in the database."
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearTestHistory();
      setSelectedRunIds([]);
      setShowClearConfirm(false);
      await fetchHistoryData();
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // Filtered in-memory items by search string
  const displayedItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.url.toLowerCase().includes(q) ||
      item.method.toLowerCase().includes(q) ||
      item.test_type.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative isolate min-h-screen overflow-hidden pb-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[1200px] h-[450px] bg-gradient-to-b from-indigo-600/10 via-cyan-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1600px] px-4 pt-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Telemetry Hub & Analytics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              History & Performance Analytics
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Audit past executions, compare benchmark regressions, and export telemetry datasets.
            </p>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Compare Trigger Button */}
            <button
              onClick={handleCompareSelected}
              disabled={selectedRunIds.length !== 2}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-md ${
                selectedRunIds.length === 2
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-indigo-500/20 hover:brightness-110 active:scale-95"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed opacity-60"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                Compare Runs ({selectedRunIds.length}/2)
              </span>
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/90 p-0.5 text-xs font-medium">
              <a
                href={getExportUrl({
                  format: "csv",
                  test_type: selectedType !== "all" ? selectedType : undefined,
                  project_id: selectedProjectId !== "all" ? selectedProjectId : undefined,
                })}
                download
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                title="Download filtered dataset as CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </a>
              <span className="h-3 w-px bg-zinc-700" />
              <a
                href={getExportUrl({
                  format: "json",
                  test_type: selectedType !== "all" ? selectedType : undefined,
                  project_id: selectedProjectId !== "all" ? selectedProjectId : undefined,
                })}
                download
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                title="Download filtered dataset as JSON"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                <span>Export JSON</span>
              </a>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchHistoryData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Clear History */}
            {items.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {showClearConfirm && (
          <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Are you sure you want to purge historical test logs? This action cannot be undone.</span>
            </div>
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

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by URL, method, or run ID..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Test Type Tabs */}
          <div className="md:col-span-4 flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
            {[
              { id: "all", label: "All Tests" },
              { id: "single", label: "Single" },
              { id: "load", label: "Load" },
              { id: "balancer", label: "Balancer" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedType(tab.id);
                  setPage(1);
                }}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition ${
                  selectedType === tab.id
                    ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Workspace Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Workspaces</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Successful Only</option>
              <option value="failed">Failed / Errored</option>
            </select>
          </div>
        </div>

        {/* Unified History Data Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm">
          {isLoading ? (
            <div className="py-24 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
              <span>Querying execution dataset from PostgreSQL...</span>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-24 text-center text-zinc-500 text-xs space-y-2">
              <History className="h-8 w-8 mx-auto text-zinc-600 opacity-60" />
              <p className="font-semibold text-zinc-400">No test executions found</p>
              <p className="text-[11px] text-zinc-500">
                Adjust your filters or dispatch tests from the Single Runner, Load Tester, or Load Balancer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">Compare</th>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Target Endpoint</th>
                    <th className="px-4 py-3.5">Volume & VUs</th>
                    <th className="px-4 py-3.5">Throughput</th>
                    <th className="px-4 py-3.5">Avg / P50 Latency</th>
                    <th className="px-4 py-3.5">Success Rate</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {displayedItems.map((item) => {
                    const typeMeta =
                      TYPE_CONFIG[item.test_type as keyof typeof TYPE_CONFIG] ||
                      TYPE_CONFIG.single;
                    const IconComponent = typeMeta.icon;
                    const methodClass =
                      METHOD_COLORS[item.method?.toUpperCase()] ||
                      "text-zinc-400 bg-zinc-800";
                    const isChecked = selectedRunIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isChecked ? "bg-indigo-500/5" : ""
                        }`}
                      >
                        {/* Compare Checkbox */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRun(item.id)}
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer"
                            title="Select to compare with another run"
                          />
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        {/* Test Type Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeMeta.badge}`}
                          >
                            <IconComponent className="h-3 w-3" />
                            <span>{typeMeta.label}</span>
                          </span>
                        </td>

                        {/* Method & Target URL */}
                        <td className="px-4 py-3 max-w-xs sm:max-w-md truncate">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${methodClass}`}
                            >
                              {item.method}
                            </span>
                            <span
                              className="text-zinc-200 truncate"
                              title={item.url}
                            >
                              {item.url}
                            </span>
                          </div>
                        </td>

                        {/* Volume & Concurrency */}
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                          {item.test_type === "single" ? (
                            <span className="text-zinc-500">1 req (1 VU)</span>
                          ) : (
                            <span>
                              {item.total_requests} reqs{" "}
                              <span className="text-zinc-500">
                                ({item.concurrency} VUs)
                              </span>
                            </span>
                          )}
                        </td>

                        {/* RPS */}
                        <td className="px-4 py-3 whitespace-nowrap text-cyan-400 font-semibold">
                          {item.rps ? `${item.rps} rps` : "—"}
                        </td>

                        {/* Latency */}
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                          {item.p50_ms ? (
                            <span>
                              {item.p50_ms}{" "}
                              <span className="text-[10px] text-zinc-500">ms</span>
                            </span>
                          ) : item.latency_avg_ms ? (
                            <span>
                              {item.latency_avg_ms}{" "}
                              <span className="text-[10px] text-zinc-500">ms</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Success Rate */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.test_type === "single" ? (
                            item.status_code ? (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  item.status_code < 400
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-rose-400 bg-rose-500/10"
                                }`}
                              >
                                {item.status_code}
                              </span>
                            ) : (
                              <span className="text-rose-400 text-[10px]">FAILED</span>
                            )
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold ${
                                  (item.success_rate || 0) >= 95
                                    ? "text-emerald-400"
                                    : (item.success_rate || 0) >= 80
                                    ? "text-amber-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {item.success_rate}%
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({item.success_count}/{item.total_requests})
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectedItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/80 px-2 py-1 text-[11px] font-sans font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                              title="Inspect full execution telemetry"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>

                            <Link
                              href="/"
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[11px] font-sans font-medium text-indigo-400 hover:bg-indigo-500/20 transition"
                              title="Replay in Single Tester"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Replay</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400">
            <div>
              Showing <span className="font-mono text-zinc-200">{displayedItems.length}</span>{" "}
              of <span className="font-mono text-zinc-200">{total}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <span className="font-mono text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Run Comparison Modal */}
      {/* --------------------------------------------------------------------- */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Benchmark Differential Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing Baseline Run A against Candidate Run B.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {isComparing ? (
              <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                <span>Computing differential percentiles & error deltas...</span>
              </div>
            ) : comparisonError ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                {comparisonError}
              </div>
            ) : comparisonData ? (
              <div className="mt-5 space-y-6">
                {/* Synthesis Verdict Card */}
                <div
                  className={`rounded-2xl border p-4 ${
                    comparisonData.comparison.verdict === "improved"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : comparisonData.comparison.verdict === "regressed"
                      ? "border-rose-500/30 bg-rose-500/10"
                      : "border-indigo-500/30 bg-indigo-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Performance Assessment
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        comparisonData.comparison.verdict === "improved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : comparisonData.comparison.verdict === "regressed"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {comparisonData.comparison.verdict}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {comparisonData.comparison.summary}
                  </p>
                </div>

                {/* Scorecard Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* RPS Throughput */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Throughput (RPS)</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-mono font-bold text-white">
                        {comparisonData.run_b.rps || 0}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold flex items-center ${
                          comparisonData.comparison.delta_rps >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {comparisonData.comparison.delta_rps >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {comparisonData.comparison.pct_rps_diff}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      vs {comparisonData.run_a.rps || 0} rps (A)
                    </span>
                  </div>

                  {/* P50 Latency */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">P50 Latency</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-mono font-bold text-white">
                        {comparisonData.run_b.p50_ms || 0} ms
                      </span>
                      {typeof comparisonData.comparison.delta_p50_ms === "number" && (
                        <span
                          className={`text-xs font-mono font-bold ${
                            comparisonData.comparison.delta_p50_ms <= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {comparisonData.comparison.delta_p50_ms > 0 ? "+" : ""}
                          {comparisonData.comparison.delta_p50_ms}ms
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      vs {comparisonData.run_a.p50_ms || 0} ms (A)
                    </span>
                  </div>

                  {/* P90 / P95 Latency */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">P90 Latency</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-mono font-bold text-white">
                        {comparisonData.run_b.p90_ms || "—"} ms
                      </span>
                      {typeof comparisonData.comparison.delta_p90_ms === "number" && (
                        <span
                          className={`text-xs font-mono font-bold ${
                            comparisonData.comparison.delta_p90_ms <= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {comparisonData.comparison.delta_p90_ms > 0 ? "+" : ""}
                          {comparisonData.comparison.delta_p90_ms}ms
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      vs {comparisonData.run_a.p90_ms || 0} ms (A)
                    </span>
                  </div>

                  {/* Error Rate Diff */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Error Rate</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-mono font-bold text-white">
                        {roundErrRate(comparisonData.run_b)}%
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          comparisonData.comparison.delta_error_rate <= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {comparisonData.comparison.delta_error_rate > 0 ? "+" : ""}
                        {comparisonData.comparison.delta_error_rate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      vs {roundErrRate(comparisonData.run_a)}% (A)
                    </span>
                  </div>
                </div>

                {/* Side-by-side Configuration Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Run A card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-sans font-bold text-indigo-400 uppercase tracking-wider text-[11px]">
                        Run A (Baseline)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(comparisonData.run_a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 truncate">{comparisonData.run_a.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>Concurrency: {comparisonData.run_a.concurrency} VUs</div>
                      <div>Requests: {comparisonData.run_a.total_requests}</div>
                      <div>Duration: {comparisonData.run_a.duration_seconds}s</div>
                      <div>P99: {comparisonData.run_a.p99_ms || "—"} ms</div>
                    </div>
                  </div>

                  {/* Run B card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-sans font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                        Run B (Candidate)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(comparisonData.run_b.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 truncate">{comparisonData.run_b.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>Concurrency: {comparisonData.run_b.concurrency} VUs</div>
                      <div>Requests: {comparisonData.run_b.total_requests}</div>
                      <div>Duration: {comparisonData.run_b.duration_seconds}s</div>
                      <div>P99: {comparisonData.run_b.p99_ms || "—"} ms</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setComparisonModalOpen(false)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Run Telemetry Inspection Drawer */}
      {/* --------------------------------------------------------------------- */}
      {inspectedItem && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Execution Telemetry</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {inspectedItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="mt-5 space-y-5 text-xs">
              {/* Primary Stats Bar */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Method</span>
                  <span className="font-bold text-white">{inspectedItem.method}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Type</span>
                  <span className="font-bold text-indigo-300 capitalize">{inspectedItem.test_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                  <span className="font-bold text-white">{inspectedItem.duration_seconds}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Throughput</span>
                  <span className="font-bold text-cyan-400">{inspectedItem.rps || "—"} rps</span>
                </div>
              </div>

              {/* Target URL */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Target Endpoint URL
                </label>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 break-all select-all">
                  {inspectedItem.url}
                </div>
              </div>

              {/* Latency Percentiles */}
              {inspectedItem.p50_ms !== undefined && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-2">
                    Percentile Distribution
                  </label>
                  <div className="grid grid-cols-4 gap-2 font-mono text-center">
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <span className="text-[10px] text-slate-500 block">P50</span>
                      <span className="font-bold text-slate-100">{inspectedItem.p50_ms} ms</span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <span className="text-[10px] text-slate-500 block">P90</span>
                      <span className="font-bold text-slate-100">{inspectedItem.p90_ms || "—"} ms</span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <span className="text-[10px] text-slate-500 block">P95</span>
                      <span className="font-bold text-slate-100">{inspectedItem.p95_ms || "—"} ms</span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <span className="text-[10px] text-slate-500 block">P99</span>
                      <span className="font-bold text-slate-100">{inspectedItem.p99_ms || "—"} ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Code or Volume */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Volume:</span>
                  <span className="font-mono text-slate-100">
                    {inspectedItem.total_requests} requests
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Successes:</span>
                  <span className="font-mono text-emerald-400">
                    {inspectedItem.success_count} ({inspectedItem.success_rate}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Failures:</span>
                  <span className="font-mono text-rose-400">
                    {inspectedItem.failure_count}
                  </span>
                </div>
                {inspectedItem.error_message && (
                  <div className="pt-2 border-t border-slate-800 text-rose-400">
                    <span className="block text-[10px] text-slate-500 uppercase">Error</span>
                    <span className="font-mono">{inspectedItem.error_message}</span>
                  </div>
                )}
              </div>

              {/* Metadata JSON */}
              {inspectedItem.metadata && Object.keys(inspectedItem.metadata).length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Telemetry Metadata / Distribution
                  </label>
                  <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(inspectedItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setInspectedItem(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundErrRate(item: UnifiedHistoryItem): number {
  if (!item.total_requests || item.failure_count === undefined) return 0;
  return Math.round((item.failure_count / item.total_requests) * 100);
}
