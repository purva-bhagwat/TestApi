"use client";

import React, { useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Globe,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Project, SavedEndpoint } from "@/types/api";
import { deleteSavedEndpoint } from "@/lib/api";

interface EndpointsSidebarProps {
  project: Project | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectEndpoint: (endpoint: SavedEndpoint, fullUrl: string) => void;
  onRefreshProject: () => Promise<void>;
  selectedEndpointId?: string;
}

export default function EndpointsSidebar({
  project,
  isOpen,
  onToggle,
  onSelectEndpoint,
  onRefreshProject,
  selectedEndpointId,
}: EndpointsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getMethodBadgeStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "POST":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PUT":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "PATCH":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "DELETE":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-700/40 text-zinc-300 border-zinc-600";
    }
  };

  const computeFullUrl = (path: string): string => {
    const cleanPath = path.trim();
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }
    const baseUrl = project?.base_url?.trim() || "";
    if (!baseUrl) {
      return cleanPath;
    }
    const normBase = baseUrl.replace(/\/+$/, "");
    const normPath = cleanPath.replace(/^\/+/, "");
    return `${normBase}/${normPath}`;
  };

  const handleDeleteEndpoint = async (
    e: React.MouseEvent,
    endpointId: string
  ) => {
    e.stopPropagation();
    if (!window.confirm("Remove this saved endpoint from your project?")) {
      return;
    }

    setDeletingId(endpointId);
    try {
      await deleteSavedEndpoint(endpointId);
      await onRefreshProject();
    } catch (err: any) {
      alert(err?.message || "Failed to delete endpoint.");
    } finally {
      setDeletingId(null);
    }
  };

  const endpoints = project?.endpoints || [];
  const filteredEndpoints = endpoints.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`relative flex flex-col border-r border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 ${
        isOpen ? "w-72 sm:w-80" : "w-12"
      }`}
    >
      {/* Sidebar Collapse Toggle Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-3">
        {isOpen ? (
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Bookmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                Saved Collections
              </h2>
              <p className="text-[10px] text-zinc-400 truncate">
                {project ? project.name : "No Workspace Selected"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto" title="Expand Saved Endpoints">
            <Bookmark className="h-5 w-5 text-indigo-400" />
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded Sidebar Body */}
      {isOpen ? (
        <div className="flex flex-1 flex-col overflow-hidden p-3">
          {/* Active Project Banner */}
          {project ? (
            <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Active Collection
                </span>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  {endpoints.length} {endpoints.length === 1 ? "saved" : "saved"}
                </span>
              </div>
              <h3 className="font-bold text-zinc-100 text-xs truncate mt-1">
                {project.name}
              </h3>
              {project.base_url && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 truncate mt-1">
                  <Globe className="h-3 w-3 text-zinc-500 shrink-0" />
                  <span className="truncate">{project.base_url}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
              <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>No Workspace Active</span>
              </div>
              <p className="text-[11px] text-amber-400/80 mt-1 leading-snug">
                Select or create a workspace using the dropdown above to view and save endpoints.
              </p>
            </div>
          )}

          {/* Search Bar */}
          {endpoints.length > 3 && (
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter saved endpoints..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Endpoints List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
            {!project ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                <Bookmark className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                Select a project workspace to load its saved collection.
              </div>
            ) : endpoints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                <Zap className="h-6 w-6 mx-auto mb-2 text-indigo-400 opacity-60" />
                <p className="font-semibold text-zinc-400">No saved endpoints</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Configure a request in the Request Builder and click{" "}
                  <span className="text-indigo-400 font-medium">Save to Project</span>.
                </p>
              </div>
            ) : filteredEndpoints.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No endpoints match &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpointId === ep.id;
                const fullUrl = computeFullUrl(ep.path);

                return (
                  <div
                    key={ep.id}
                    onClick={() => onSelectEndpoint(ep, fullUrl)}
                    className={`group relative flex flex-col rounded-xl border p-2.5 text-left cursor-pointer transition ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 shadow-sm"
                        : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${getMethodBadgeStyle(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-semibold text-xs text-zinc-200 group-hover:text-white truncate">
                          {ep.name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteEndpoint(e, ep.id)}
                        disabled={deletingId === ep.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title="Delete endpoint"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400 truncate">
                      <span className="truncate">{ep.path}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Collapsed View Mini Icons */
        <div className="flex flex-1 flex-col items-center py-4 space-y-3">
          {project && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 text-xs font-bold"
              title={`Active Project: ${project.name}`}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          {endpoints.slice(0, 8).map((ep) => (
            <button
              key={ep.id}
              onClick={() => {
                onToggle();
                onSelectEndpoint(ep, computeFullUrl(ep.path));
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[9px] font-mono font-bold ${getMethodBadgeStyle(
                ep.method
              )}`}
              title={`${ep.method} ${ep.name} (${ep.path})`}
            >
              {ep.method.slice(0, 3)}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
