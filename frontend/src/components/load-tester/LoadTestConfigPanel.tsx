import React, { useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Flame,
  FolderKanban,
  Gauge,
  Globe,
  Layers,
  Loader2,
  Play,
  Plus,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { KeyValuePair, LoadTestConfig, SavedEndpoint } from "@/types/api";
import { useWorkspace } from "@/context/WorkspaceContext";

interface LoadTestConfigPanelProps {
  onStart: (config: LoadTestConfig) => void;
  isLoading: boolean;
}

const HTTP_METHODS = [
  { value: "GET", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { value: "POST", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "PUT", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "DELETE", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
];

export const LoadTestConfigPanel: React.FC<LoadTestConfigPanelProps> = ({
  onStart,
  isLoading,
}) => {
  const { activeProject, activeEndpoints } = useWorkspace();

  const [url, setUrl] = useState<string>("https://httpbin.org/get");
  const [method, setMethod] = useState<string>("GET");
  const [concurrentUsers, setConcurrentUsers] = useState<number>(10);
  const [totalRequests, setTotalRequests] = useState<number>(50);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(10);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");

  // Accordion toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Advanced options: headers & body
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: "1", key: "User-Agent", value: "TestApi-LoadEngine/1.0", enabled: true },
  ]);
  const [bodyText, setBodyText] = useState<string>(
    JSON.stringify({ test_type: "load_benchmark", timestamp: new Date().toISOString() }, null, 2)
  );

  const handleAddHeader = () => {
    setHeaders((prev) => [
      ...prev,
      { id: Date.now().toString(), key: "", value: "", enabled: true },
    ]);
  };

  const handleUpdateHeader = (
    id: string,
    field: "key" | "value" | "enabled",
    val: string | boolean
  ) => {
    setHeaders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders((prev) => prev.filter((item) => item.id !== id));
  };

  const applyPreset = (vus: number, reqs: number) => {
    setConcurrentUsers(vus);
    setTotalRequests(reqs);
  };

  const handleSelectFromCollection = (endpointId: string) => {
    setSelectedEndpointId(endpointId);
    if (!endpointId) return;

    const endpoint = activeEndpoints.find((ep) => ep.id === endpointId);
    if (!endpoint) return;

    let full = endpoint.path.trim();
    if (!full.startsWith("http://") && !full.startsWith("https://")) {
      const base = activeProject?.base_url?.trim() || "";
      if (base) {
        full = `${base.replace(/\/+$/, "")}/${full.replace(/^\/+/, "")}`;
      }
    }
    setUrl(full);
    setMethod(endpoint.method.toUpperCase());

    if (endpoint.headers && Object.keys(endpoint.headers).length > 0) {
      const hdrs: KeyValuePair[] = Object.entries(endpoint.headers).map(([k, v], idx) => ({
        id: `${Date.now()}_hdr_${idx}`,
        key: k,
        value: String(v),
        enabled: true,
      }));
      setHeaders(hdrs);
      setShowAdvanced(true);
    }

    if (endpoint.body !== null && endpoint.body !== undefined) {
      setBodyText(
        typeof endpoint.body === "string"
          ? endpoint.body
          : JSON.stringify(endpoint.body, null, 2)
      );
      setShowAdvanced(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const headersRecord: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim() !== "")
      .forEach((h) => {
        headersRecord[h.key.trim()] = h.value;
      });

    let parsedBody: any = undefined;
    if (method !== "GET" && bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    const config: LoadTestConfig = {
      url: url.trim(),
      method,
      concurrent_users: concurrentUsers,
      total_requests: totalRequests,
      timeout_seconds: timeoutSeconds,
      headers: Object.keys(headersRecord).length > 0 ? headersRecord : undefined,
      body: parsedBody,
    };

    onStart(config);
  };

  const currentMethodConfig =
    HTTP_METHODS.find((m) => m.value === method) || HTTP_METHODS[0];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Load Test Engine</h2>
            <p className="text-[11px] text-zinc-400">Configure virtual concurrency and volume</p>
          </div>
        </div>

        {/* Presets */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset(5, 20)}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Light (5/20)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(20, 100)}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Medium (20/100)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(50, 300)}
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            High (50/300)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Collection Quick Picker Bar */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Bookmark className="h-4 w-4 text-indigo-400 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-zinc-300">Workspace Collection:</span>
              <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-mono text-indigo-300">
                {activeProject ? activeProject.name : "No Workspace Selected"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">Target Endpoint:</span>
            <select
              value={selectedEndpointId}
              onChange={(e) => handleSelectFromCollection(e.target.value)}
              disabled={activeEndpoints.length === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-cyan-500 disabled:opacity-50 transition cursor-pointer max-w-[240px]"
            >
              <option value="">
                {activeEndpoints.length === 0
                  ? "No saved endpoints"
                  : "-- Select from Collection --"}
              </option>
              {activeEndpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  [{ep.method}] {ep.name} ({ep.path})
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Method & URL Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Method Select */}
          <div className="min-w-[110px]">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`w-full appearance-none rounded-xl border px-3 py-2.5 text-xs font-bold tracking-wider outline-none transition cursor-pointer ${currentMethodConfig.color}`}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m.value} value={m.value} className="bg-zinc-900 text-white font-mono">
                  {m.value}
                </option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              required
              className="w-full overflow-x-auto text-left rounded-xl border border-zinc-700/80 bg-zinc-950/70 px-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Trigger Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Batch...</span>
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 text-amber-300" />
                <span>Start Load Test</span>
              </>
            )}
          </button>
        </div>

        {/* Concurrency and Volume Sliders / Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Concurrency (VUs) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>Concurrency (VUs)</span>
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {concurrentUsers}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={concurrentUsers}
              onChange={(e) => setConcurrentUsers(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
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
                <Zap className="h-3.5 w-3.5 text-indigo-400" />
                <span>Total Requests</span>
              </span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                {totalRequests}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={totalRequests}
              onChange={(e) => setTotalRequests(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>10 reqs</span>
              <span>250 reqs</span>
              <span>500 reqs</span>
            </div>
          </div>

          {/* Timeout */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                <span>Timeout / Req</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {timeoutSeconds}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>1s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>
        </div>

        {/* Collapsible Accordion for Headers & JSON Body */}
        <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition"
          >
            <span>Payload & Custom Headers</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500">
                {headers.filter((h) => h.key.trim()).length} headers • {method !== "GET" ? "Body active" : "GET (no body)"}
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {showAdvanced && (
            <div className="p-4 border-t border-zinc-800 space-y-4">
              {/* Headers Sub-section */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-2">
                  <span>Headers</span>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Header</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {headers.map((h) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) =>
                          handleUpdateHeader(h.id, "enabled", e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 accent-cyan-500"
                      />
                      <input
                        type="text"
                        placeholder="Header name"
                        value={h.key}
                        onChange={(e) =>
                          handleUpdateHeader(h.id, "key", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-zinc-200"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={h.value}
                        onChange={(e) =>
                          handleUpdateHeader(h.id, "value", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(h.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Sub-section */}
              {method !== "GET" && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    JSON Payload Body
                  </label>
                  <textarea
                    rows={4}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoadTestConfigPanel;
