import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminMetrics, AdminMetrics } from "../services/api";
import {
  Users,
  Building2,
  Bed,
  DollarSign,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

interface AdminDashboardProps {
  token: string;
  onNavigateToReports: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onNavigateToReports,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchAdminMetrics(token);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setMetrics(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-slate-400">
        <Loader2 className="h-9 w-9 sm:h-10 sm:w-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs sm:text-sm font-medium">Calculating real-time database KPI aggregates...</p>
      </div>
    );
  }

  if (errorMessage && !metrics) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 sm:p-7 text-center max-w-lg mx-auto">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm sm:text-base font-semibold text-white">Metrics Aggregation Error</h3>
        <p className="text-xs text-rose-300 mt-1 mb-4 break-words">{errorMessage}</p>
        <button
          onClick={loadMetrics}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition min-h-[40px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              Executive Admin Dashboard
            </h2>
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              Live DB Aggregates
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time occupancy rates, student registrations, ledger dues, and daily dining tallies
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={onNavigateToReports}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 min-h-[40px]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">View Reports</span>
          </button>
          <button
            onClick={loadMetrics}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-850 px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm min-h-[40px]"
          >
            <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Students */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Active Students</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{metrics.totalStudents}</span>
            <span className="text-xs text-indigo-400 font-medium">Registered</span>
          </div>
          <p className="text-xs text-slate-500 pt-1 border-t border-slate-800/60 truncate">
            Across {metrics.totalHostels} active hostel blocks
          </p>
        </div>

        {/* Card 2: Bed Occupancy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Bed Occupancy</span>
            <Bed className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{metrics.occupancyRate}%</span>
            <span className="text-xs text-emerald-400 font-medium truncate">{metrics.occupiedBeds} / {metrics.totalBeds} Beds</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Financial Outstanding Dues */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Pending Dues</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono truncate">
              ₹{metrics.financials.totalPendingDues.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-medium flex-shrink-0">{metrics.financials.pendingChargesCount} Invoices</span>
          </div>
          <p className="text-xs text-slate-500 pt-1 border-t border-slate-800/60 truncate">
            Collected: ₹{metrics.financials.totalPaidAmount.toLocaleString()}
          </p>
        </div>

        {/* Card 4: Daily Mess Count Today */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Today's Lunch</span>
            <UtensilsCrossed className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {metrics.messSummary.todayLunchDineIn + metrics.messSummary.todayLunchTiffin}
            </span>
            <span className="text-xs text-indigo-300 font-medium">Headcount</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Dine-In: <strong className="text-white font-mono">{metrics.messSummary.todayLunchDineIn}</strong></span>
            <span>Tiffin: <strong className="text-amber-400 font-mono">{metrics.messSummary.todayLunchTiffin}</strong></span>
          </div>
        </div>
      </div>

      {/* Two Detailed Split Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Occupancy & Inventory Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>Hostel &amp; Bed Capacity Breakdown</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-400">Total Rooms</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">{metrics.totalRooms}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-400">Occupied Beds</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-0.5">{metrics.occupiedBeds}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] sm:text-xs text-slate-400">Vacancies</p>
                <p className="text-lg sm:text-xl font-bold text-indigo-400 font-mono mt-0.5">{metrics.vacantBeds}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Overall Campus Utilization</span>
              <span className="font-semibold text-white">{metrics.occupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial & Mess Summary Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span>Financials &amp; Quality Metrics</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 gap-2">
                <span className="text-slate-400 truncate">Gross Billed Charges:</span>
                <span className="font-bold font-mono text-white flex-shrink-0">₹{metrics.financials.totalChargesAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 gap-2">
                <span className="text-slate-400 truncate">Verified Collections (Paid):</span>
                <span className="font-bold font-mono text-emerald-400 flex-shrink-0">₹{metrics.financials.totalPaidAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 gap-2">
                <span className="text-slate-400 truncate">Disbursed Refunds:</span>
                <span className="font-bold font-mono text-slate-300 flex-shrink-0">₹{metrics.financials.totalRefundedAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 gap-2">
                <span className="text-slate-400 truncate">Average Food Rating:</span>
                <span className="font-bold font-mono text-amber-400 flex-shrink-0">
                  {metrics.messSummary.averageRating ? `${metrics.messSummary.averageRating} / 5.0 ★` : "No ratings yet"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
