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
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-slate-500">
        <Loader2 className="h-9 w-9 sm:h-10 sm:w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs sm:text-sm font-semibold text-slate-700">Loading your personalized student portal...</p>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8 text-center max-w-lg mx-auto shadow-xs">
        <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto mb-2.5" />
        <h3 className="text-base font-bold text-slate-900">Student Portal Access Error</h3>
        <p className="text-xs text-rose-700 mt-1 mb-4 break-words">{errorMessage}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition min-h-[40px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
              Welcome back, {data.student.fullName || "Resident"}
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              {data.student.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Student ID: <span className="font-mono text-slate-800 font-semibold">{data.student.studentId || "N/A"}</span> &bull; {data.student.email}
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition shadow-xs min-h-[40px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {mealSuccessNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span className="break-words">{mealSuccessNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span className="break-words font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Grid: Room & Contract & Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Residency & Room Allocation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-3">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span>Room Allocation</span>
            </div>

            {data.allocation.hasAllocation ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Hostel Residence</p>
                  <p className="text-base font-bold text-slate-900 break-words mt-0.5">
                    {data.allocation.hostelName || "Aryabhata Hall"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Room Number</p>
                    <p className="text-sm font-bold text-slate-900 font-mono truncate mt-0.5">{data.allocation.roomNumber || "N/A"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Bed Code</p>
                    <p className="text-sm font-bold text-slate-900 font-mono truncate mt-0.5">{data.allocation.bedCode || "N/A"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                <p className="font-semibold text-slate-700">No active bed allocation found.</p>
                <p className="text-slate-400 mt-1">Contact hostel warden for room assignment.</p>
              </div>
            )}
          </div>

          {data.allocation.hasAllocation && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-2.5 border-t border-slate-100">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
              <span>Active Occupancy Confirmed</span>
            </div>
          )}
        </div>

        {/* Card 2: Contract Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>Residency Contract</span>
            </div>

            {data.contract.hasContract ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Status</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 mt-0.5">
                      {data.contract.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Monthly Rent</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      ₹{data.contract.monthlyRentAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="min-w-0">
                    <p className="text-slate-500 text-[11px] font-medium">Tenure Start</p>
                    <p className="font-mono text-slate-800 font-medium truncate mt-0.5">
                      {data.contract.startDate ? String(data.contract.startDate).split("T")[0] : "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-500 text-[11px] font-medium">Tenure End</p>
                    <p className="font-mono text-slate-800 font-medium truncate mt-0.5">
                      {data.contract.endDate ? String(data.contract.endDate).split("T")[0] : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                <p className="font-semibold text-slate-700">No active residency contract registered.</p>
              </div>
            )}
          </div>

          {data.contract.hasContract && (
            <div className="text-xs text-slate-600 pt-2.5 border-t border-slate-100 truncate">
              Deposit: <span className="font-mono text-slate-900 font-semibold">₹{data.contract.securityDepositAmount?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Card 3: Financial Summary & Dues */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between md:col-span-2 lg:col-span-1 hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between text-sm font-semibold mb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>Financial Dues</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  data.financials.outstandingBalance > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {data.financials.outstandingBalance > 0 ? "Pending Dues" : "All Clear"}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">Outstanding:</span>
              <span
                className={`text-xl sm:text-2xl font-extrabold font-mono truncate ${
                  data.financials.outstandingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                ₹{data.financials.outstandingBalance.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-500 text-[11px] font-medium">Total Charges</p>
                <p className="font-mono text-slate-800 font-bold truncate mt-0.5">₹{data.financials.totalCharges.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px] font-medium">Total Paid</p>
                <p className="font-mono text-emerald-600 font-bold truncate mt-0.5">₹{data.financials.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {data.financials.recentTransactions.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Recent Receipt:</p>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono">
                <span className="text-indigo-600 font-semibold truncate mr-2">{data.financials.recentTransactions[0].receiptNumber}</span>
                <span className="text-emerald-700 font-bold flex-shrink-0">₹{data.financials.recentTransactions[0].amountPaid}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Mess & Lunch Selection Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Daily Lunch Selection &amp; Mess</h3>
              <p className="text-xs text-slate-500">
                Choose Dine-in or packed Tiffin before the daily 09:30 AM cutoff
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 text-[11px] sm:text-xs">Cutoff: 09:30 AM (IST)</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] sm:text-xs border ${
                data.mess.cutoffPassed
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {data.mess.cutoffPassed ? "Cutoff Passed" : "Selection Open"}
            </span>
          </div>
        </div>

        {/* Selection Choice Switcher with Touch-Friendly Targets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Your Current Lunch Choice for ({data.mess.todayDate}):</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                {data.mess.todaySelection.selection === "TIFFIN" ? "PACKED TIFFIN" : "DINE-IN"}
              </span>
              {data.mess.todaySelection.isDefault && (
                <span className="text-[10px] sm:text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">Default</span>
              )}
              {data.mess.todaySelection.isOverridden && (
                <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-medium">Overridden</span>
              )}
            </div>
          </div>

          <div className="sm:ml-auto grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleMealSelection("DINE_IN")}
              disabled={data.mess.cutoffPassed || submittingMeal || data.mess.todaySelection.selection === "DINE_IN"}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition min-h-[44px] ${
                data.mess.todaySelection.selection === "DINE_IN"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95"
              } disabled:opacity-50`}
            >
              Select Dine-in
            </button>
            <button
              onClick={() => handleMealSelection("TIFFIN")}
              disabled={data.mess.cutoffPassed || submittingMeal || data.mess.todaySelection.selection === "TIFFIN"}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition min-h-[44px] ${
                data.mess.todaySelection.selection === "TIFFIN"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95"
              } disabled:opacity-50`}
            >
              Select Tiffin
            </button>
          </div>
        </div>

        {/* Upcoming 3-Day Menus */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Upcoming Rotational Menus</h4>
          </div>

          {data.mess.upcomingMenus.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
              No daily menus scheduled yet for this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.mess.upcomingMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700">{menu.mealDate}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {menu.mealType}
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{menu.title}</h5>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {menu.items.map((item, idx) => (
                      <li key={idx} className="truncate">{item}</li>
                    ))}
                  </ul>
                  {menu.isSpecialMeal && (
                    <span className="inline-block text-[10px] sm:text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold mt-1">
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
