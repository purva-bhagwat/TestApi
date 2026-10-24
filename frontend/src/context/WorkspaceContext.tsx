"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Project, SavedEndpoint } from "@/types/api";
import { getProjects } from "@/lib/api";

interface WorkspaceContextType {
  projects: Project[];
  activeProject: Project | null;
  activeEndpoints: SavedEndpoint[];
  isLoading: boolean;
  selectProject: (project: Project | null) => void;
  selectProjectById: (projectId: string | null) => void;
  refreshProjects: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = "testapi_active_project_id";

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored active project id from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setActiveProjectId(stored);
      }
    } catch {
      // LocalStorage might be disabled in private mode
    }
  }, []);

  const refreshProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      setProjects(data);

      // If activeProjectId is not set or not in data, pick the first project if available
      setActiveProjectId((prev) => {
        if (prev && data.some((p) => p.id === prev)) {
          return prev;
        }
        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      console.warn("Could not fetch workspace projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const selectProject = (project: Project | null) => {
    const id = project ? project.id : null;
    setActiveProjectId(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  const selectProjectById = (projectId: string | null) => {
    setActiveProjectId(projectId);
    try {
      if (projectId) {
        localStorage.setItem(STORAGE_KEY, projectId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const activeEndpoints = useMemo(() => {
    return activeProject?.endpoints || [];
  }, [activeProject]);

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        activeProject,
        activeEndpoints,
        isLoading,
        selectProject,
        selectProjectById,
        refreshProjects,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
