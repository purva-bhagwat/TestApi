"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Gauge,
  History,
  Layers,
  RefreshCw,
  Send,
  Server,
  Zap,
} from "lucide-react";
import HistoryDrawer from "@/components/tester/HistoryDrawer";
import RequestBuilder from "@/components/tester/RequestBuilder";
import ResponseViewer from "@/components/tester/ResponseViewer";
import EndpointsSidebar from "@/components/workspaces/EndpointsSidebar";
import {
  clearTestHistory,
  executeSingleTest,
  getHealthStatus,
  getTestHistory,
  HealthCheckResponse,
} from "@/lib/api";
import { SavedEndpoint, SingleTestRequest, SingleTestResponse } from "@/types/api";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function HomePage() {
  const { projects, activeProject, refreshProjects } = useWorkspace();

  // Backend health status
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Single API execution state
  const [testResponse, setTestResponse] = useState<SingleTestResponse | null>(null);
  const [selectedRun, setSelectedRun] = useState<SingleTestResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Workspaces & Collections State
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | undefined>(undefined);
  const [populatedEndpoint, setPopulatedEndpoint] = useState<{
    endpoint: SavedEndpoint;
    fullUrl: string;
    timestamp: number;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // History state
  const [history, setHistory] = useState<SingleTestResponse[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const checkBackendHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch (err: any) {
      setHealthError(
        err?.message || "Backend unreachable at http://localhost:8000"
      );
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const rawData: any = await getTestHistory(30, 0);
      const historyItems = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const totalCount = typeof rawData?.total === "number" ? rawData.total : historyItems.length;
      setHistory(historyItems);
      setHistoryTotal(totalCount);
    } catch (err) {
      console.warn("Could not load test history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearTestHistory();
      setHistory([]);
      setHistoryTotal(0);
      setSelectedRun(null);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleSelectRun = (run: SingleTestResponse) => {
    setSelectedRun(run);
    setTestResponse(run);
    setIsHistoryOpen(false);
  };

  const handleSelectEndpoint = (endpoint: SavedEndpoint, fullUrl: string) => {
    setSelectedEndpointId(endpoint.id);
    setPopulatedEndpoint({
      endpoint,
      fullUrl,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    checkBackendHealth();
    loadHistory();
  }, []);

  const handleExecuteRequest = async (request: SingleTestRequest) => {
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const result = await executeSingleTest(request);
      setTestResponse(result);
      setSelectedRun(result);

      // Immediately prepend run into local history without page reload
      setHistory((prev) => [
        result,
        ...prev.filter((item) => item.id !== result.id),
      ]);
      setHistoryTotal((prev) => prev + 1);
    } catch (err: any) {
      setExecutionError(
        err?.message ||
          "Failed to execute API request. Make sure the backend server is running."
      );
      setTestResponse(null);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen pb-16 flex flex-col">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[1200px] h-[450px] bg-gradient-to-b from-indigo-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header & Navigation Actions */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md relative z-30">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-2">
                <Zap className="h-3.5 w-3.5 text-indigo-400" />
                <span>Interactive API Testing Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Single Endpoint Runner
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Construct REST requests, organize saved collections, and inspect sub-millisecond latencies.
              </p>
            </div>

            {/* Action Bar: History Drawer Toggle, Health Badge */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">

              {/* History Toggle Button */}
              <button
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
                title="Toggle historical test runs"
              >
                <History className="h-4 w-4 text-emerald-400" />
                <span>History</span>
                {historyTotal > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                    {historyTotal}
                  </span>
                )}
              </button>

              {/* Backend Connectivity Status Badge */}
              {healthLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-400">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Checking gateway...</span>
                </div>
              ) : health ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold">Backend Connected</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">
                    ({health.status})
                  </span>
                </div>
              ) : (
                <button
                  onClick={checkBackendHealth}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                  title="Click to retry connecting to backend"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Backend Offline (Retry)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area: Side-by-side Endpoints Sidebar and Runner */}
      <div className="flex flex-1 min-h-[calc(100vh-140px)]">
        {/* Collapsible Left Endpoints Sidebar */}
        <EndpointsSidebar
          project={activeProject}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onSelectEndpoint={handleSelectEndpoint}
          onRefreshProject={refreshProjects}
          selectedEndpointId={selectedEndpointId}
        />

        {/* Main Interactive Studio Grid: RequestBuilder & ResponseViewer */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Column: Request Builder */}
              <div className="h-full">
                <RequestBuilder
                  onSend={handleExecuteRequest}
                  isLoading={isExecuting}
                  selectedRun={selectedRun}
                  activeProject={activeProject}
                  projects={projects}
                  onEndpointSaved={refreshProjects}
                  populatedEndpoint={populatedEndpoint}
                />
              </div>

              {/* Right Column: Response Viewer */}
              <div className="h-full">
                <ResponseViewer
                  response={testResponse}
                  isLoading={isExecuting}
                  error={executionError}
                />
              </div>
            </div>

            {/* Platform Architecture & Features Info Banner */}
            <div className="mt-12 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Platform Workflow & Automation
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  Workspaces • Saved Collections • PostgreSQL 16 • Replay Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-mono">
                      1
                    </span>
                    <span>Workspace Collections</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Group target services into isolated projects. Manage Base URLs and configure reusable endpoint collections.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono">
                      2
                    </span>
                    <span>One-Click Population</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Select any saved endpoint from the sidebar to instantly populate Method, URL, Headers, and JSON body parameters.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      3
                    </span>
                    <span>Sub-Millisecond Auditing</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Precision monotonic clocks measure network timing. Historical runs and response telemetry are permanently recorded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Drawer Component */}
      <HistoryDrawer
        history={history}
        total={historyTotal}
        isLoading={historyLoading}
        selectedRunId={selectedRun?.id}
        onSelectRun={handleSelectRun}
        onRefresh={loadHistory}
        onClear={handleClearHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Dark overlay backdrop when drawer is open */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}
    </div>
  );
}
