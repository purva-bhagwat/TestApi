"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileCode,
  Layers,
  Terminal,
  Zap,
} from "lucide-react";
import { SingleTestResponse } from "@/types/api";

interface ResponseViewerProps {
  response: SingleTestResponse | null;
  isLoading: boolean;
  error?: string | null;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "raw">("body");
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (!response?.response_body) return;
    navigator.clipboard.writeText(response.response_body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (statusCode?: number, errorMessage?: string) => {
    if (errorMessage && !statusCode) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Error / Refused</span>
        </span>
      );
    }

    if (!statusCode) {
      return null;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{statusCode} OK</span>
        </span>
      );
    }

    if (statusCode >= 300 && statusCode < 400) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
          <span>{statusCode} Redirect</span>
        </span>
      );
    }

    if (statusCode >= 400 && statusCode < 500) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{statusCode} Client Error</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{statusCode} Server Error</span>
      </span>
    );
  };

  // Format response body as pretty-printed JSON if possible
  const renderFormattedBody = (rawBody?: string) => {
    if (!rawBody) {
      return (
        <p className="p-4 text-xs italic text-zinc-500 font-mono">
          (Empty response payload)
        </p>
      );
    }

    try {
      const parsed = JSON.parse(rawBody);
      const formatted = JSON.stringify(parsed, null, 2);
      return (
        <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
          {formatted}
        </pre>
      );
    } catch {
      return (
        <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {rawBody}
        </pre>
      );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl shadow-xl flex flex-col h-full">
      {/* Response Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Terminal className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-white">Response Inspector</h2>
        </div>

        {/* Status badges when response is present */}
        {response && (
          <div className="flex items-center gap-3">
            {getStatusBadge(response.status_code, response.error_message)}

            {response.response_time_ms !== undefined && (
              <span className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs font-mono text-zinc-300">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>{response.response_time_ms} ms</span>
              </span>
            )}

            <button
              onClick={handleCopy}
              disabled={!response.response_body}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition disabled:opacity-40"
              title="Copy response body"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mt-4 flex-1 flex flex-col">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-indigo-500/20" />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-200">
              Dispatching request...
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Awaiting backend response and latency benchmarking
            </p>
          </div>
        )}

        {/* Global Connection / Fetch Error */}
        {!isLoading && error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 my-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">
                  Request Execution Failed
                </h4>
                <p className="text-xs text-zinc-400 mt-1 font-mono break-all">
                  {error}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Verify the backend server is running at{" "}
                  <code className="text-zinc-300">http://localhost:8000</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State before any request */}
        {!isLoading && !response && !error && (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-800/80 rounded-xl my-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-3 text-zinc-400">
              <FileCode className="h-6 w-6 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">
              No Request Dispatched Yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Configure parameters on the left and click &quot;Send&quot; to inspect real-time latency, headers, and payload data.
            </p>
          </div>
        )}

        {/* Response Data Display */}
        {!isLoading && response && (
          <div className="flex-1 flex flex-col">
            {/* Error Message Alert (if backend reported connection/timeout issue) */}
            {response.error_message && (
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <span className="font-semibold">Execution Notice: </span>
                <span className="font-mono">{response.error_message}</span>
              </div>
            )}

            {/* Sub-tabs: Body / Headers / Raw */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("body")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "body"
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Formatted JSON
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("headers")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "headers"
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Headers</span>
                  {response.response_headers && (
                    <span className="ml-1 rounded-full bg-zinc-700 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                      {Object.keys(response.response_headers).length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("raw")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "raw"
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Raw
                </button>
              </div>

              {response.id && (
                <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">
                  ID: {response.id}
                </span>
              )}
            </div>

            {/* Response Body Box */}
            <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/90 min-h-[220px] max-h-[420px] overflow-auto">
              {activeTab === "body" && renderFormattedBody(response.response_body)}

              {activeTab === "raw" && (
                <pre className="p-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                  {response.response_body || "(Empty payload)"}
                </pre>
              )}

              {activeTab === "headers" && (
                <div className="p-3 space-y-1">
                  {response.response_headers &&
                  Object.keys(response.response_headers).length > 0 ? (
                    Object.entries(response.response_headers).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start text-xs font-mono py-1 border-b border-zinc-900/60 last:border-0"
                        >
                          <span className="text-indigo-400 font-semibold w-1/3 break-all">
                            {key}:
                          </span>
                          <span className="text-zinc-300 w-2/3 break-all pl-2">
                            {String(value)}
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-xs text-zinc-500 italic p-2">
                      No response headers returned.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
