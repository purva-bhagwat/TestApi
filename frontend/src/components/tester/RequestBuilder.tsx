"use client";

import React, { useEffect, useState } from "react";
import {
  AlignLeft,
  CheckCircle2,
  Code2,
  FileJson,
  Loader2,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { KeyValuePair, SingleTestRequest, SingleTestResponse } from "@/types/api";

interface RequestBuilderProps {
  onSend: (request: SingleTestRequest) => void;
  isLoading: boolean;
  selectedRun?: SingleTestResponse | null;
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
      { id: Date.now().toString(), key: "", value: "", enabled: true },
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

  const handleFormatBody = () => {
    if (!bodyText.trim()) return;
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
      setBodyError(null);
    } catch (err: any) {
      setBodyError("Invalid JSON syntax: " + err.message);
    }
  };

  const handleValidateJson = (text: string) => {
    setBodyText(text);
    if (!text.trim()) {
      setBodyError(null);
      return;
    }
    try {
      JSON.parse(text);
      setBodyError(null);
    } catch (err: any) {
      setBodyError("Invalid JSON syntax");
    }
  };

  const handleLoadSample = (sampleType: "get" | "post" | "error") => {
    if (sampleType === "get") {
      setMethod("GET");
      setUrl("https://httpbin.org/get");
      setQueryParams([{ id: "1", key: "query", value: "hello_world", enabled: true }]);
      setActiveTab("params");
    } else if (sampleType === "post") {
      setMethod("POST");
      setUrl("https://httpbin.org/post");
      setHeaders([
        { id: "1", key: "Content-Type", value: "application/json", enabled: true },
        { id: "2", key: "Accept", value: "application/json", enabled: true },
      ]);
      setBodyText(
        JSON.stringify(
          {
            title: "Performance Benchmark",
            concurrency: 50,
            status: "ready",
          },
          null,
          2
        )
      );
      setBodyError(null);
      setActiveTab("body");
    } else {
      setMethod("GET");
      setUrl("https://httpbin.org/status/404");
      setActiveTab("params");
    }
  };

  const handleSend = () => {
    // Collect query params
    const qpRecord: Record<string, string> = {};
    queryParams
      .filter((q) => q.enabled && q.key.trim() !== "")
      .forEach((q) => {
        qpRecord[q.key.trim()] = q.value;
      });

    // Collect headers
    const hRecord: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim() !== "")
      .forEach((h) => {
        hRecord[h.key.trim()] = h.value;
      });

    // Resolve body
    let parsedBody: any = undefined;
    if (method !== "GET" && bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    const payload: SingleTestRequest = {
      url: url.trim(),
      method,
      headers: Object.keys(hRecord).length > 0 ? hRecord : undefined,
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

      {/* Main Request Bar: Method + URL + Send Button */}
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

        {/* Send Trigger Button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !url.trim()}
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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
            <span>Params</span>
            {queryParams.filter((q) => q.key.trim()).length > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-400 font-mono">
                {queryParams.filter((q) => q.key.trim()).length}
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
            <span>Headers</span>
            {headers.filter((h) => h.key.trim()).length > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-400 font-mono">
                {headers.filter((h) => h.key.trim()).length}
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
            <span>Body</span>
            {bodyText.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Timeout input */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-[11px]">Timeout:</span>
          <input
            type="number"
            min="1"
            max="120"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value) || 30)}
            className="w-14 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-center font-mono text-[11px] text-zinc-200 outline-none"
          />
          <span className="text-[11px]">s</span>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4 flex-1 min-h-[220px]">
        {/* PARAMS TAB */}
        {activeTab === "params" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1 mb-1">
              <span>Query Parameters</span>
              <button
                type="button"
                onClick={handleAddParam}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Parameter</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {queryParams.map((param) => (
                <div key={param.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) =>
                      handleUpdateParam(param.id, "enabled", e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 accent-indigo-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Key (e.g. page)"
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
              {queryParams.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-500">
                  No query parameters configured. Click &quot;Add Parameter&quot; to append URL parameters.
                </p>
              )}
            </div>
          </div>
        )}

        {/* HEADERS TAB */}
        {activeTab === "headers" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1 mb-1">
              <span>Request Headers</span>
              <button
                type="button"
                onClick={handleAddHeader}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Header</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {headers.map((header) => (
                <div key={header.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) =>
                      handleUpdateHeader(header.id, "enabled", e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 accent-indigo-500 cursor-pointer"
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
    </div>
  );
};

export default RequestBuilder;
