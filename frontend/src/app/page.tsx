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
  Layers,
  RefreshCw,
  Send,
  Server,
  Zap,
} from "lucide-react";
import { getHealthStatus, HealthCheckResponse } from "@/lib/api";

export default function HomePage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to connect to backend service at http://localhost:8000"
      );
      setHealth(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-4">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Final-Year Engineering Project Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            API Testing & Performance{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Analysis Platform
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400">
            A high-throughput monorepo architecture engineered for single endpoint
            diagnostics, distributed load generation, and real-time latency analytics.
          </p>
        </div>

        {/* Backend Connectivity Status Card */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700">
                <Server className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  FastAPI Backend Gateway
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  GET /api/v1/health • http://localhost:8000
                </p>
              </div>
            </div>

            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-zinc-400 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>

          <div className="pt-5">
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-sm text-zinc-300">
                  Pinging backend health check endpoint...
                </span>
              </div>
            ) : health ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-300">
                        Connected Successfully
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/20">
                        HTTP 200 OK
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Backend app:{" "}
                      <span className="font-mono text-zinc-200">
                        {health.app}
                      </span>{" "}
                      | Status:{" "}
                      <span className="font-mono text-zinc-200">
                        {health.status}
                      </span>
                    </p>
                    {lastChecked && (
                      <p className="text-[11px] text-zinc-500">
                        Last ping: {lastChecked}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-rose-300">
                        Backend Unreachable
                      </span>
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-mono text-rose-400 border border-rose-500/20">
                        Connection Refused
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Start the FastAPI backend with:{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-200">
                        uvicorn app.main:app --reload
                      </code>
                    </p>
                    {error && (
                      <p className="text-[11px] font-mono text-rose-400/90 pt-1">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modular Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-indigo-500/50 hover:bg-zinc-900/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Send className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Single API Tester
            </h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Execute parameterized REST calls with customizable headers, body payloads,
              query strings, and inspect millisecond-level response timelines.
            </p>
            <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Endpoint Module</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-cyan-500/50 hover:bg-zinc-900/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Gauge className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Load & Stress Testing
            </h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Simulate concurrent virtual users (RPS / concurrency curves), analyze
              p95/p99 latency percentiles, error rates, and throughput bottlenecks.
            </p>
            <div className="flex items-center text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              <span>Performance Engine</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-emerald-500/50 hover:bg-zinc-900/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              PostgreSQL & Async Session
            </h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Configured via Docker Compose, SQLAlchemy 2.0 with asyncpg driver, and
              Alembic for persistent test run records and benchmark telemetry.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Persistence Layer</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Stack Quick Reference */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Monorepo Stack Specifications
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-zinc-500">Frontend</p>
              <p className="text-zinc-200 font-semibold mt-1">Next.js 14 / App Router</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-zinc-500">Backend API</p>
              <p className="text-zinc-200 font-semibold mt-1">FastAPI + Pydantic v2</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-zinc-500">ORM & Driver</p>
              <p className="text-zinc-200 font-semibold mt-1">SQLAlchemy 2.0 / asyncpg</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-zinc-500">Database</p>
              <p className="text-zinc-200 font-semibold mt-1">PostgreSQL 16 (Docker)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
