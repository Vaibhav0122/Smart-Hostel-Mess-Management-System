import React, { useEffect, useState, useCallback } from "react";
import {
  fetchStudentSummary,
  selectMealChoice,
  StudentSummary,
} from "../services/api";
import {
  Building,
  FileText,
  DollarSign,
  Utensils,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

interface StudentDashboardProps {
  token: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ token }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<StudentSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittingMeal, setSubmittingMeal] = useState<boolean>(false);
  const [mealSuccessNotice, setMealSuccessNotice] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchStudentSummary(token);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setData(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleMealSelection = async (choice: "DINE_IN" | "TIFFIN") => {
    if (!data?.mess.todayDate) return;
    setSubmittingMeal(true);
    setMealSuccessNotice(null);
    setErrorMessage(null);

    const res = await selectMealChoice(token, data.mess.todayDate, choice);
    setSubmittingMeal(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to update meal selection.");
    } else {
      setMealSuccessNotice(res.message || `Lunch choice set to ${choice}.`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              mess: {
                ...prev.mess,
                todaySelection: {
                  selection: choice,
                  isDefault: false,
                  isOverridden: false,
                },
              },
            }
          : prev
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-slate-400">
        <Loader2 className="h-9 w-9 sm:h-10 sm:w-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs sm:text-sm font-medium">Loading your personalized student portal...</p>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 sm:p-7 text-center max-w-lg mx-auto">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm sm:text-base font-semibold text-white">Student Portal Access Error</h3>
        <p className="text-xs text-rose-300 mt-1 mb-4 break-words">{errorMessage}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition min-h-[40px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              Welcome back, {data.student.fullName || "Resident"}
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              {data.student.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Student ID: <span className="font-mono text-slate-200 font-semibold">{data.student.studentId || "N/A"}</span> • {data.student.email}
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-850 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm min-h-[40px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {mealSuccessNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:p-3.5 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span className="break-words">{mealSuccessNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 sm:p-3.5 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      {/* Grid: Room & Contract & Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Residency & Room Allocation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 shadow-sm space-y-3.5 sm:space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span>Room Allocation</span>
            </div>

            {data.allocation.hasAllocation ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-400">Hostel Residence</p>
                  <p className="text-sm sm:text-base font-semibold text-white break-words">
                    {data.allocation.hostelName || "Aryabhata Hall"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-400">Room Number</p>
                    <p className="text-sm font-semibold text-white font-mono truncate">{data.allocation.roomNumber || "N/A"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-400">Bed Code</p>
                    <p className="text-sm font-semibold text-white font-mono truncate">{data.allocation.bedCode || "N/A"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p>No active bed allocation found.</p>
                <p className="text-slate-500 mt-1">Contact hostel warden for room assignment.</p>
              </div>
            )}
          </div>

          {data.allocation.hasAllocation && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-slate-800/60">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Active Occupancy Confirmed</span>
            </div>
          )}
        </div>

        {/* Card 2: Contract Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 shadow-sm space-y-3.5 sm:space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>Residency Contract</span>
            </div>

            {data.contract.hasContract ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-400">Status</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                      {data.contract.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] sm:text-xs text-slate-400">Monthly Rent</p>
                    <p className="text-sm sm:text-base font-bold text-white font-mono">
                      ₹{data.contract.monthlyRentAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="min-w-0">
                    <p className="text-slate-400 text-[11px]">Tenure Start</p>
                    <p className="font-mono text-slate-200 truncate">
                      {data.contract.startDate ? String(data.contract.startDate).split("T")[0] : "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-[11px]">Tenure End</p>
                    <p className="font-mono text-slate-200 truncate">
                      {data.contract.endDate ? String(data.contract.endDate).split("T")[0] : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p>No active residency contract registered.</p>
              </div>
            )}
          </div>

          {data.contract.hasContract && (
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/60 truncate">
              Deposit: <span className="font-mono text-slate-200 font-medium">₹{data.contract.securityDepositAmount?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Card 3: Financial Summary & Dues */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 shadow-sm space-y-3.5 sm:space-y-4 flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-sm font-semibold mb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>Financial Dues</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  data.financials.outstandingBalance > 0
                    ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                }`}
              >
                {data.financials.outstandingBalance > 0 ? "Pending Dues" : "All Clear"}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">Outstanding:</span>
              <span
                className={`text-xl sm:text-2xl font-extrabold font-mono truncate ${
                  data.financials.outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                ₹{data.financials.outstandingBalance.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-800/60 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Total Charges</p>
                <p className="font-mono text-slate-200 font-semibold truncate">₹{data.financials.totalCharges.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Total Paid</p>
                <p className="font-mono text-emerald-400 font-semibold truncate">₹{data.financials.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {data.financials.recentTransactions.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-[11px] font-semibold text-slate-400 mb-1">Recent Receipt:</p>
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg font-mono">
                <span className="text-indigo-300 font-medium truncate mr-2">{data.financials.recentTransactions[0].receiptNumber}</span>
                <span className="text-emerald-400 font-bold flex-shrink-0">₹{data.financials.recentTransactions[0].amountPaid}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Mess & Lunch Selection Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Daily Lunch Selection &amp; Mess</h3>
              <p className="text-xs text-slate-400">
                Choose Dine-in or packed Tiffin before the daily 09:30 AM cutoff
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 text-[11px] sm:text-xs">Cutoff: 09:30 AM (IST)</span>
            <span
              className={`px-2 py-0.5 rounded-full font-semibold text-[11px] sm:text-xs ${
                data.mess.cutoffPassed
                  ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              }`}
            >
              {data.mess.cutoffPassed ? "Cutoff Passed" : "Selection Open"}
            </span>
          </div>
        </div>

        {/* Selection Choice Switcher with Touch-Friendly Targets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Your Current Lunch Choice for ({data.mess.todayDate}):</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {data.mess.todaySelection.selection === "TIFFIN" ? "PACKED TIFFIN" : "DINE-IN"}
              </span>
              {data.mess.todaySelection.isDefault && (
                <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Default</span>
              )}
              {data.mess.todaySelection.isOverridden && (
                <span className="text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Overridden</span>
              )}
            </div>
          </div>

          <div className="sm:ml-auto grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleMealSelection("DINE_IN")}
              disabled={data.mess.cutoffPassed || submittingMeal || data.mess.todaySelection.selection === "DINE_IN"}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition min-h-[44px] ${
                data.mess.todaySelection.selection === "DINE_IN"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95"
              } disabled:opacity-50`}
            >
              Select Dine-in
            </button>
            <button
              onClick={() => handleMealSelection("TIFFIN")}
              disabled={data.mess.cutoffPassed || submittingMeal || data.mess.todaySelection.selection === "TIFFIN"}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition min-h-[44px] ${
                data.mess.todaySelection.selection === "TIFFIN"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95"
              } disabled:opacity-50`}
            >
              Select Tiffin
            </button>
          </div>
        </div>

        {/* Upcoming 3-Day Menus */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <h4 className="text-xs sm:text-sm font-semibold text-white">Upcoming Rotational Menus</h4>
          </div>

          {data.mess.upcomingMenus.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No daily menus scheduled yet for this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {data.mess.upcomingMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4 space-y-2.5 shadow-inner"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-indigo-300">{menu.mealDate}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {menu.mealType}
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-semibold text-white truncate">{menu.title}</h5>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {menu.items.map((item, idx) => (
                      <li key={idx} className="truncate">{item}</li>
                    ))}
                  </ul>
                  {menu.isSpecialMeal && (
                    <span className="inline-block text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium mt-1">
                      Special Feast
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
