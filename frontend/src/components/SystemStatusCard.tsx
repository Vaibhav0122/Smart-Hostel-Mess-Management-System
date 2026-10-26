import React from "react";
import {
  Server,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Radio,
} from "lucide-react";
import { HealthResponseData } from "../services/api";
import { HealthBadge } from "./HealthBadge";

interface SystemStatusCardProps {
  loading: boolean;
  healthData: HealthResponseData | null;
  errorMessage: string | null;
  latencyMs: number;
  onRefresh: () => void;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  loading,
  healthData,
  errorMessage,
  latencyMs,
  onRefresh,
}) => {
  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const currentStatus = loading
    ? "LOADING"
    : healthData
    ? healthData.status
    : "OFFLINE";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 lg:p-7 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5 sm:pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-white">
              Backend Health &amp; Environment
            </h2>
            <HealthBadge status={currentStatus} />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time diagnostics check against <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-indigo-300 font-mono">/api/v1/health</code>
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50 min-h-[44px]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Diagnosing..." : "Re-check Health"}</span>
        </button>
      </div>

      {/* When Health Data is successfully retrieved */}
      {healthData && (
        <div className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Express Server */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Express Server</span>
                <Server className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-bold text-white">Active</span>
                <span className="text-xs text-slate-400 font-mono">({latencyMs}ms)</span>
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-emerald-400 flex items-center gap-1 truncate">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Security Headers OK</span>
              </p>
            </div>

            {/* MongoDB Connection */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">MongoDB</span>
                <Database className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-bold text-white">
                  {healthData.database.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400 truncate font-mono">
                {healthData.database.name || "smart_hostel_db"}
              </p>
            </div>

            {/* Node Runtime */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Node Runtime</span>
                <Cpu className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold text-white font-mono">{healthData.nodeVersion}</span>
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400">TypeScript Strict Engine</p>
            </div>

            {/* Process Uptime */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Server Uptime</span>
                <Clock className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  {formatUptime(healthData.uptimeSeconds)}
                </span>
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400">Production Daemon Active</p>
            </div>
          </div>

          {/* Replica Set Status Banner */}
          <div
            className={`rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${
              healthData.database.replicaSetEnabled
                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                : "border-amber-500/30 bg-amber-950/20 text-amber-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {healthData.database.replicaSetEnabled ? (
                <Radio className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold leading-snug">
                  {healthData.database.replicaSetEnabled
                    ? "MongoDB Replica Set Active: ACID Multi-Document Transactions Enabled"
                    : "MongoDB Standalone Mode Detected: Replica Set Not Configured"}
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  {healthData.database.replicaSetEnabled
                    ? "All critical multi-document operations (bed allocations, checkouts, payment settlements) execute inside fully ACID transaction sessions."
                    : "Transactions require MongoDB configured with replica set (rs0) or MongoDB Atlas cluster. Run single-node replica set for full transaction guarantees."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Error Message when Backend is Unavailable */}
      {!healthData && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 sm:p-5 text-rose-200">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-3 w-full">
              <div>
                <h3 className="font-bold text-rose-100 text-sm sm:text-base">Backend API is Currently Offline</h3>
                <p className="mt-1 text-xs text-rose-300/90 leading-relaxed break-words">
                  {errorMessage || "The frontend could not establish a connection to the backend health endpoint."}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/70 p-3 sm:p-4 border border-rose-900/40 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 flex-shrink-0" /> Recommended Troubleshooting Steps:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-mono text-[11px] sm:text-xs">
                  <li>Start backend daemon: <span className="text-indigo-300 font-bold break-all">npm run dev:backend</span></li>
                  <li>Verify MongoDB is running locally on port 27017</li>
                  <li>Check <span className="text-slate-200">.env</span> has <span className="text-slate-200">PORT=5000</span> and valid secrets</li>
                  <li>Verify CORS origin allows <span className="text-slate-200">http://localhost:5173</span></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatusCard;
