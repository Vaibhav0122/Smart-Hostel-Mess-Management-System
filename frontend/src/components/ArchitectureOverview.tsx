import React from "react";
import {
  Layers,
  ShieldAlert,
  Hash,
  DatabaseZap,
  CheckCircle,
  FileCode2,
} from "lucide-react";

export const ArchitectureOverview: React.FC = () => {
  const pillars = [
    {
      title: "Layered Monorepo Architecture",
      icon: <Layers className="h-5 w-5 text-indigo-400" />,
      description:
        "Clean separation of frontend (React + Vite + Tailwind) and backend (Express + TypeScript) with shared API contracts.",
      status: "Phase 2 Active",
    },
    {
      title: "Hardened Security Foundation",
      icon: <ShieldAlert className="h-5 w-5 text-emerald-400" />,
      description:
        "Helmet HTTP headers, CORS whitelisting, centralized error handling, and strict Zod runtime environment validation.",
      status: "Configured",
    },
    {
      title: "Atomic Student ID Generator",
      icon: <Hash className="h-5 w-5 text-cyan-400" />,
      description:
        "Zero-padded STU-YYYYMM sequence supporting unlimited expansion beyond 999 (e.g. STU-2026101000) with race condition recovery.",
      status: "Tested & Passing",
    },
    {
      title: "MongoDB & ACID Replica Sets",
      icon: <DatabaseZap className="h-5 w-5 text-amber-400" />,
      description:
        "Mongoose connection adapter with automatic detection of MongoDB Replica Sets for multi-document ACID transactions.",
      status: "Ready",
    },
    {
      title: "Automated Jest Test Suite",
      icon: <CheckCircle className="h-5 w-5 text-violet-400" />,
      description:
        "Robust unit and integration tests for counter service, health check endpoints, not-found routes, and Zod schemas.",
      status: "30/30 Tests Pass",
    },
    {
      title: "Phase-by-Phase Roadmap",
      icon: <FileCode2 className="h-5 w-5 text-rose-400" />,
      description:
        "Clear boundaries: Phase 2 establishes foundations; Phase 3 will introduce Auth & RBAC; subsequent phases build allocations & dining.",
      status: "Phase 2 Scoped",
    },
  ];

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">
            Phase 2 Architectural Foundation
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Validated core components ready for Phase 3 Authentication &amp; RBAC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-800/80 p-2.5">{pillar.icon}</div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {pillar.status}
              </span>
            </div>
            <h4 className="mt-3.5 text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {pillar.title}
            </h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
