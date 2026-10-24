"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, History, Network, Send, Zap } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import WorkspaceSelector from "@/components/workspaces/WorkspaceSelector";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { projects, activeProject, selectProject, refreshProjects } = useWorkspace();

  const navLinks = [
    { href: "/", label: "Single API Tester", icon: Send, color: "text-indigo-400" },
    { href: "/load-testing", label: "Load Testing", icon: Gauge, color: "text-cyan-400" },
    { href: "/load-balancer", label: "Load Balancer", icon: Network, color: "text-amber-400" },
    { href: "/history", label: "History", icon: History, color: "text-emerald-400" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">TestApi</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                v0.1.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 -mt-0.5 font-medium">Performance Platform</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm ring-1 ring-zinc-700/60"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? item.color : "text-zinc-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status / Workspace Actions */}
        <div className="flex items-center gap-2.5">
          {/* Global Workspace Selector */}
          <WorkspaceSelector
            projects={projects}
            selectedProject={activeProject}
            onSelectProject={selectProject}
            onRefreshProjects={refreshProjects}
          />

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Monorepo Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
