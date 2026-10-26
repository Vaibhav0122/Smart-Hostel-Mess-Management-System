import React from "react";

interface HealthBadgeProps {
  status: "HEALTHY" | "DEGRADED" | "OFFLINE" | "LOADING";
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status }) => {
  if (status === "LOADING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700 flex-shrink-0">
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
        <span>Checking API...</span>
      </span>
    );
  }

  if (status === "HEALTHY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20 flex-shrink-0">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
        <span>Backend Online</span>
      </span>
    );
  }

  if (status === "DEGRADED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20 flex-shrink-0">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span>Degraded <span className="hidden sm:inline">(Standalone DB)</span></span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/20 flex-shrink-0">
      <span className="h-2 w-2 rounded-full bg-rose-400" />
      <span>Offline</span>
    </span>
  );
};

export default HealthBadge;
