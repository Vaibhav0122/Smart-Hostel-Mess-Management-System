import React from "react";
import { Building2, UtensilsCrossed, ShieldCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Smart Hostel &amp; Mess
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                Phase 2
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Operations &amp; Dining Management Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>MERN + TypeScript</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300">
            <UtensilsCrossed className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Daily Cutoff:</span>
            <span className="font-mono text-indigo-300">09:30 AM</span>
          </div>
        </div>
      </div>
    </header>
  );
};
