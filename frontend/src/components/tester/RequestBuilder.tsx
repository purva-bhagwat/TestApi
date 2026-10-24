"use client";

import React, { useEffect, useState } from "react";
import {
  AlignLeft,
  Bookmark,
  Check,
  CheckCircle2,
  Code2,
  FileJson,
  FolderKanban,
  Globe,
  Loader2,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  KeyValuePair,
  Project,
  SavedEndpoint,
  SingleTestRequest,
  SingleTestResponse,
} from "@/types/api";
import { createSavedEndpoint } from "@/lib/api";

export interface RequestBuilderProps {
  onSend: (request: SingleTestRequest) => void;
  isLoading: boolean;
  selectedRun?: SingleTestResponse | null;
  activeProject?: Project | null;
  projects?: Project[];
  onEndpointSaved?: () => Promise<void>;
  populatedEndpoint?: {
    endpoint: SavedEndpoint;
    fullUrl: string;
    timestamp: number;
  } | null;
}

const HTTP_METHODS = [
  { value: "GET", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { value: "POST", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "PUT", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "PATCH", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { value: "DELETE", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
];

export const RequestBuilder: React.FC<RequestBuilderProps> = ({
  onSend,
  isLoading,
  selectedRun,
  activeProject,
  projects = [],
  onEndpointSaved,
  populatedEndpoint,
}) => {
  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState<string>("https://httpbin.org/get");
  const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params");
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);

  // Key-value pairs for Query Params & Headers
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([
    { id: "1", key: "test", value: "true", enabled: true },
  ]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: "1", key: "Accept", value: "application/json", enabled: true },
    { id: "2", key: "User-Agent", value: "TestApi/1.0", enabled: true },
  ]);

  // Request Body
  const [bodyText, setBodyText] = useState<string>(
    JSON.stringify({ message: "Hello from TestApi!", timestamp: new Date().toISOString() }, null, 2)
  );
  const [bodyError, setBodyError] = useState<string | null>(null);

  // Save to Project Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [customPath, setCustomPath] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveModalError, setSaveModalError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Synchronize when active project changes
  useEffect(() => {
    if (activeProject) {
      setTargetProjectId(activeProject.id);
    } else if (projects.length > 0 && !targetProjectId) {
      setTargetProjectId(projects[0].id);
    }
  }, [activeProject, projects]);

  // Synchronize when a saved endpoint from the sidebar is selected
  useEffect(() => {
    if (!populatedEndpoint) return;
    const { endpoint, fullUrl } = populatedEndpoint;

    setUrl(fullUrl);
    setMethod(endpoint.method.toUpperCase());

    // Populate Headers
    if (endpoint.headers && Object.keys(endpoint.headers).length > 0) {
      const hdrs: KeyValuePair[] = Object.entries(endpoint.headers).map(
        ([k, v], idx) => ({
          id: `${Date.now()}_ep_h_${idx}`,
          key: k,
          value: String(v),
          enabled: true,
        })
      );
      setHeaders(hdrs);
    } else {
      setHeaders([]);
    }

    // Populate Body
    if (endpoint.body !== null && endpoint.body !== undefined) {
      try {
        const parsed =
          typeof endpoint.body === "string"
            ? endpoint.body
            : JSON.stringify(endpoint.body, null, 2);
        setBodyText(parsed);
        setBodyError(null);
      } catch {
        setBodyText(String(endpoint.body));
        setBodyError(null);
      }
      setActiveTab("body");
    } else {
      setBodyText("");
      setBodyError(null);
      setActiveTab("params");
    }
  }, [populatedEndpoint]);

  // Synchronize when a historical run is selected for replay
  useEffect(() => {
    if (!selectedRun) return;

    if (selectedRun.method) setMethod(selectedRun.method.toUpperCase());
    if (selectedRun.url) setUrl(selectedRun.url);

    // Sync query params
    if (selectedRun.query_params && Object.keys(selectedRun.query_params).length > 0) {
      const qp: KeyValuePair[] = Object.entries(selectedRun.query_params).map(([k, v], idx) => ({
        id: `${Date.now()}_qp_${idx}`,
        key: k,
        value: String(v),
        enabled: true,
      }));
      setQueryParams(qp);
    } else {
      setQueryParams([]);
    }

    // Sync headers
    if (selectedRun.headers && Object.keys(selectedRun.headers).length > 0) {
      const hdrs: KeyValuePair[] = Object.entries(selectedRun.headers).map(([k, v], idx) => ({
        id: `${Date.now()}_h_${idx}`,
        key: k,
        value: String(v),
        enabled: true,
      }));
      setHeaders(hdrs);
    } else {
      setHeaders([]);
    }

    // Sync body
    if (selectedRun.body) {
      try {
        const parsed = JSON.parse(selectedRun.body);
        setBodyText(JSON.stringify(parsed, null, 2));
        setBodyError(null);
      } catch {
        setBodyText(selectedRun.body);
        setBodyError(null);
      }
      setActiveTab("body");
    } else {
      setBodyText("");
      setBodyError(null);
      setActiveTab("params");
    }
  }, [selectedRun]);

  // Handlers for dynamic key-value rows
  const handleAddParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { id: `${Date.now()}_qp`, key: "", value: "", enabled: true },
    ]);
  };

  const handleUpdateParam = (
    id: string,
    field: "key" | "value" | "enabled",
    val: string | boolean
  ) => {
    setQueryParams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveParam = (id: string) => {
    setQueryParams((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddHeader = () => {
    setHeaders((prev) => [
      ...prev,
      { id: `${Date.now()}_h`, key: "", value: "", enabled: true },
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

  const handleValidateJson = (val: string) => {
    setBodyText(val);
    if (!val.trim()) {
      setBodyError(null);
      return;
    }
    try {
      JSON.parse(val);
      setBodyError(null);
    } catch (err: any) {
      setBodyError(err.message || "Invalid JSON syntax");
    }
  };

  const handleFormatBody = () => {
    if (!bodyText.trim()) return;
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
      setBodyError(null);
    } catch (err: any) {
      setBodyError("Cannot beautify: Invalid JSON");
    }
  };

  const handleLoadSample = (sampleType: "get" | "post") => {
    if (sampleType === "get") {
      setMethod("GET");
      setUrl("https://httpbin.org/get");
      setQueryParams([
        { id: "1", key: "search", value: "developer-tools", enabled: true },
        { id: "2", key: "limit", value: "10", enabled: true },
      ]);
      setHeaders([
        { id: "1", key: "Accept", value: "application/json", enabled: true },
      ]);
      setActiveTab("params");
    } else {
      setMethod("POST");
      setUrl("https://httpbin.org/post");
      setQueryParams([]);
      setHeaders([
        { id: "1", key: "Content-Type", value: "application/json", enabled: true },
        { id: "2", key: "Accept", value: "application/json", enabled: true },
      ]);
      setBodyText(
        JSON.stringify(
          {
            project: "API Platform",
            version: "2.0.0",
            status: "active",
            features: ["load-testing", "mock-target", "collections"],
          },
          null,
          2
        )
      );
      setBodyError(null);
      setActiveTab("body");
    }
  };

  // Open Save to Project Modal
  const handleOpenSaveModal = () => {
    setSaveModalError(null);
    setSaveSuccessMsg(null);

    // Compute relative path
    let defaultPath = url.trim();
    const currentBase = activeProject?.base_url?.trim();
    if (currentBase && defaultPath.startsWith(currentBase)) {
      defaultPath = defaultPath.slice(currentBase.length);
      if (!defaultPath.startsWith("/")) {
        defaultPath = "/" + defaultPath;
      }
    } else {
      try {
        const parsed = new URL(defaultPath);
        defaultPath = parsed.pathname + parsed.search;
      } catch {
        if (!defaultPath.startsWith("/")) {
          defaultPath = "/" + defaultPath;
        }
      }
    }

    setCustomPath(defaultPath);
    setEndpointName(`${method} ${defaultPath}`);
    setTargetProjectId(activeProject ? activeProject.id : projects[0]?.id || "");
    setIsSaveModalOpen(true);
  };

  // Save Endpoint to Backend
  const handleSaveEndpointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId) {
      setSaveModalError("Please select a workspace project first.");
      return;
    }
    if (!endpointName.trim()) {
      setSaveModalError("Endpoint name is required.");
      return;
    }
    if (!customPath.trim()) {
      setSaveModalError("Endpoint path is required.");
      return;
    }

    // Build headers record
    const hdrsRecord: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        hdrsRecord[h.key.trim()] = h.value;
      }
    });

    // Parse body if present
    let parsedBody: any = null;
    if (bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    setIsSaving(true);
    setSaveModalError(null);
    try {
      await createSavedEndpoint(targetProjectId, {
        name: endpointName.trim(),
        method: method.toUpperCase(),
        path: customPath.trim(),
        headers: Object.keys(hdrsRecord).length > 0 ? hdrsRecord : undefined,
        body: parsedBody,
      });

      if (onEndpointSaved) {
        await onEndpointSaved();
      }

      setSaveSuccessMsg("Endpoint successfully saved to workspace collection!");
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSaveSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      setSaveModalError(err?.message || "Failed to save endpoint.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = () => {
    if (!url.trim()) return;

    // Build Headers object
    const headersRecord: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        headersRecord[h.key.trim()] = h.value;
      }
    });

    // Build Query Params object
    const qpRecord: Record<string, string> = {};
    queryParams.forEach((qp) => {
      if (qp.enabled && qp.key.trim()) {
        qpRecord[qp.key.trim()] = qp.value;
      }
    });

    // Parse Body
    let parsedBody: any = undefined;
    if (bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    const payload: SingleTestRequest = {
      url: url.trim(),
      method,
      headers: Object.keys(headersRecord).length > 0 ? headersRecord : undefined,
      query_params: Object.keys(qpRecord).length > 0 ? qpRecord : undefined,
      body: parsedBody,
      timeout_seconds: timeoutSeconds,
    };

    onSend(payload);
  };

  const currentMethodConfig =
    HTTP_METHODS.find((m) => m.value === method) || HTTP_METHODS[0];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl shadow-xl flex flex-col h-full">
      {/* Header & Quick Samples */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-white">Request Builder</h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1 hidden sm:inline">Presets:</span>
          <button
            onClick={() => handleLoadSample("get")}
            type="button"
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            HTTP GET
          </button>
          <button
            onClick={() => handleLoadSample("post")}
            type="button"
            className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            HTTP POST
          </button>
        </div>
      </div>

      {/* Main Request Bar: Method + URL + Save to Project + Send Button */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2">
        {/* Method Select */}
        <div className="relative min-w-[110px]">
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
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
            placeholder="https://api.example.com/v1/resource"
            className="w-full overflow-x-auto text-left rounded-xl border border-zinc-700/80 bg-zinc-950/70 px-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Save to Project Button */}
        <button
          onClick={handleOpenSaveModal}
          disabled={!url.trim()}
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-700 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0"
          title="Save endpoint to active workspace collection"
        >
          <Bookmark className="h-4 w-4 text-indigo-400" />
          <span className="hidden md:inline">Save to Project</span>
          <span className="md:hidden">Save</span>
        </button>

        {/* Send Trigger Button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !url.trim()}
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="mt-5 flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("params")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "params"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AlignLeft className="h-3.5 w-3.5 text-sky-400" />
            <span>Params</span>
            {queryParams.filter((q) => q.enabled && q.key).length > 0 && (
              <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400">
                {queryParams.filter((q) => q.enabled && q.key).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("headers")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "headers"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Headers</span>
            {headers.filter((h) => h.enabled && h.key).length > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                {headers.filter((h) => h.enabled && h.key).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("body")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "body"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-amber-400" />
            <span>Body</span>
            {bodyText.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* Timeout input */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <span>Timeout:</span>
          <input
            type="number"
            min={1}
            max={120}
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value) || 30)}
            className="w-14 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-center text-xs text-zinc-200 outline-none focus:border-zinc-700"
          />
          <span>s</span>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4 flex-1 overflow-y-auto">
        {/* QUERY PARAMS TAB */}
        {activeTab === "params" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Query Parameters</span>
              <button
                type="button"
                onClick={handleAddParam}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Param</span>
              </button>
            </div>

            <div className="space-y-2">
              {queryParams.map((param) => (
                <div key={param.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) =>
                      handleUpdateParam(param.id, "enabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Key"
                    value={param.key}
                    onChange={(e) =>
                      handleUpdateParam(param.id, "key", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) =>
                      handleUpdateParam(param.id, "value", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveParam(param.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition"
                    title="Remove parameter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HEADERS TAB */}
        {activeTab === "headers" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Headers</span>
              <button
                type="button"
                onClick={handleAddHeader}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Header</span>
              </button>
            </div>

            <div className="space-y-2">
              {headers.map((header) => (
                <div key={header.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) =>
                      handleUpdateHeader(header.id, "enabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Header (e.g. Authorization)"
                    value={header.key}
                    onChange={(e) =>
                      handleUpdateHeader(header.id, "key", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) =>
                      handleUpdateHeader(header.id, "value", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(header.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition"
                    title="Remove header"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BODY TAB */}
        {activeTab === "body" && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="font-semibold">Raw JSON Payload</span>
              <div className="flex items-center gap-3">
                {bodyError ? (
                  <span className="text-rose-400 font-mono text-[10px]">
                    {bodyError}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Valid JSON</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleFormatBody}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Beautify</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              <textarea
                value={bodyText}
                onChange={(e) => handleValidateJson(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                rows={8}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-700 resize-none transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save to Project Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Save to Project</h3>
                  <p className="text-xs text-zinc-400">
                    Add endpoint parameters to your workspace collection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveModalError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {saveModalError}
              </div>
            )}

            {saveSuccessMsg && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEndpointSubmit} className="mt-4 space-y-4">
              {/* Target Project Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Destination Workspace <span className="text-indigo-400">*</span>
                </label>
                {projects.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    No workspace found. Please create a project workspace first.
                  </p>
                ) : (
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} {proj.base_url ? `(${proj.base_url})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Endpoint Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Endpoint Display Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={endpointName}
                  onChange={(e) => setEndpointName(e.target.value)}
                  placeholder="e.g. Fetch All Users, User Login"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Method and Path preview / edit */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Relative Path or URL <span className="text-indigo-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-2 text-xs font-mono font-bold border ${currentMethodConfig.color}`}
                  >
                    {method}
                  </span>
                  <input
                    type="text"
                    required
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="/api/v1/resource"
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Summary of what will be saved */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Configured Headers:</span>
                  <span className="font-mono text-zinc-200">
                    {headers.filter((h) => h.enabled && h.key).length} keys
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Body Payload:</span>
                  <span className="font-mono text-zinc-200">
                    {bodyText.trim() ? "JSON configured" : "None"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !targetProjectId}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/30"
                >
                  {isSaving ? "Saving..." : "Save Endpoint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestBuilder;
