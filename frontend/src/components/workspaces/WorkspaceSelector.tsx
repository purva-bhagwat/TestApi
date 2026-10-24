"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  ChevronDown,
  Check,
  Globe,
  Trash2,
  X,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Project } from "@/types/api";
import { createProject, deleteProject } from "@/lib/api";

interface WorkspaceSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  onRefreshProjects: () => Promise<void>;
}

export default function WorkspaceSelector({
  projects,
  selectedProject,
  onSelectProject,
  onRefreshProjects,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Project Form State
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:8000");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Project workspace name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await createProject({
        name: name.trim(),
        base_url: baseUrl.trim() || undefined,
        description: description.trim() || undefined,
      });

      await onRefreshProjects();
      onSelectProject(created);
      setIsModalOpen(false);
      setName("");
      setBaseUrl("http://127.0.0.1:8000");
      setDescription("");
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (
    e: React.MouseEvent,
    projectId: string
  ) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this workspace and all saved endpoints inside it?"
      )
    ) {
      return;
    }

    try {
      await deleteProject(projectId);
      if (selectedProject?.id === projectId) {
        onSelectProject(null);
      }
      await onRefreshProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to delete project.");
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-indigo-500/50 hover:bg-zinc-800 transition shadow-sm backdrop-blur-sm"
        title="Select or switch active project workspace"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition">
          <FolderKanban className="h-3.5 w-3.5" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
            Workspace
          </span>
          <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
            {selectedProject ? selectedProject.name : "Select Project Workspace"}
          </span>
        </div>

        {selectedProject?.base_url && (
          <span className="hidden xl:inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700/60 max-w-[130px] truncate">
            <Globe className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
            <span className="truncate">{selectedProject.base_url}</span>
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-1">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Workspaces ({projects.length})
              </span>
            </div>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-600/30 transition"
            >
              <Plus className="h-3 w-3" />
              <span>New Project</span>
            </button>
          </div>

          {/* Quick Option: Scratchpad (No Project) */}
          <div
            onClick={() => {
              onSelectProject(null);
              setIsOpen(false);
            }}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition ${
              !selectedProject
                ? "bg-indigo-600/10 border border-indigo-500/30 text-white"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              <span className="font-medium">Ad-hoc Runner (No Workspace)</span>
            </div>
            {!selectedProject && <Check className="h-4 w-4 text-indigo-400" />}
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
            {projects.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                <FolderKanban className="h-6 w-6 mx-auto mb-1 text-zinc-600 opacity-60" />
                No project workspaces yet.
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="block mx-auto mt-2 text-indigo-400 hover:underline font-medium"
                >
                  Create your first workspace &rarr;
                </button>
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                const endpointsCount = proj.endpoints?.length || 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      setIsOpen(false);
                    }}
                    className={`group flex items-center justify-between rounded-xl p-2.5 text-xs cursor-pointer transition border ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-sm"
                        : "border-transparent text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-700/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                          isSelected
                            ? "bg-indigo-500/30 text-indigo-300"
                            : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"
                        }`}
                      >
                        <FolderKanban className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate text-zinc-100 group-hover:text-white">
                            {proj.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-zinc-800 border border-zinc-700/70 px-1.5 py-0.2 text-[9px] font-mono text-zinc-400">
                            {endpointsCount} {endpointsCount === 1 ? "endpoint" : "endpoints"}
                          </span>
                        </div>
                        {proj.base_url && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                            <Globe className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{proj.base_url}</span>
                          </div>
                        )}
                        {proj.description && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-400 mr-1" />
                      )}
                      <button
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create New Workspace
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Group related API endpoints under a single collection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Project Workspace Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PeoplePay360 Backend or Stripe Gateway"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Base API URL (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="e.g. http://127.0.0.1:8000 or https://api.github.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-3.5 py-2 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Endpoints saved in this project can inherit or prefix this Base URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief notes about microservices or authentication tokens..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
