import React from "react";
import {
  Layers,
  ShieldCheck,
  Hash,
  DatabaseZap,
  CheckCircle2,
  Utensils,
} from "lucide-react";

export const ArchitectureOverview: React.FC = () => {
  const pillars = [
    {
      title: "Layered Monorepo Architecture",
      icon: <Layers className="h-5 w-5 text-indigo-400" />,
      description:
        "Clean decoupling of React 18 + Vite + Tailwind frontend and Express + TypeScript backend with shared API contracts.",
      badge: "TypeScript Strict",
    },
    {
      title: "Enterprise RBAC & Security",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
      description:
        "Dual-token JWT authentication, Argon2id hashing, IP brute-force rate limiters, Helmet headers, and IDOR protection.",
      badge: "Defense-in-Depth",
    },
    {
      title: "Atomic Sequential ID Engine",
      icon: <Hash className="h-5 w-5 text-cyan-400" />,
      description:
        "High-concurrency sequence generation for Student IDs, Invoices, Receipts, and Refunds with automatic expansion beyond 999.",
      badge: "Zero-Collision",
    },
    {
      title: "MongoDB & ACID Transactions",
      icon: <DatabaseZap className="h-5 w-5 text-amber-400" />,
      description:
        "Multi-document ACID transactions across bed allocations, room transfers, and financial settlements on replica sets.",
      badge: "ACID Guaranteed",
    },
    {
      title: "Automated Jest Test Suite",
      icon: <CheckCircle2 className="h-5 w-5 text-violet-400" />,
      description:
        "Comprehensive unit and integration coverage across authentication, allocations, contracts, ledgers, menus, and reporting.",
      badge: "179/179 Passing",
    },
    {
      title: "Timezone Dining & Cutoff Engine",
      icon: <Utensils className="h-5 w-5 text-rose-400" />,
      description:
        "09:30 AM local cutoff evaluation, automatic Dine-in defaults, emergency warden overrides, and waste-reducing kitchen rosters.",
      badge: "Real-Time Roster",
    },
  ];

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            System Architecture &amp; Core Pillars
          </h3>
          <p className="text-xs text-slate-400">
            Engineered to enterprise standards for university and residential accommodation
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
          MERN + TypeScript Stack
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-indigo-950/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-800/80 text-white shadow-inner">
                  {pillar.icon}
                </div>
                <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-300 font-mono">
                  {pillar.badge}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {pillar.title}
              </h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ArchitectureOverview;
