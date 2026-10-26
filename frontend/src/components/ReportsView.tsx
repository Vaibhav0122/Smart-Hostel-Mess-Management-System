import React, { useState, useEffect, useCallback } from "react";
import {
  fetchStudentReport,
  fetchOccupancyReport,
  fetchFinanceReport,
  fetchMessReport,
  downloadReportCsv,
  StudentReportItem,
  OccupancyHostelItem,
  FinanceReportData,
  MessReportItem,
} from "../services/api";
import {
  Download,
  Users,
  Building,
  DollarSign,
  UtensilsCrossed,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ReportsViewProps {
  token: string;
}

type ReportTab = "students" | "occupancy" | "finances" | "mess";

export const ReportsView: React.FC<ReportsViewProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("students");
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student report states
  const [students, setStudents] = useState<StudentReportItem[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentStatus, setStudentStatus] = useState<string>("");
  const [studentPagination, setStudentPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Occupancy report states
  const [occupancyHostels, setOccupancyHostels] = useState<OccupancyHostelItem[]>([]);
  const [occupancyOverall, setOccupancyOverall] = useState<any>(null);

  // Finance report states
  const [financeData, setFinanceData] = useState<FinanceReportData | null>(null);

  // Mess report states
  const [messMetrics, setMessMetrics] = useState<MessReportItem[]>([]);

  // Load active tab data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    if (activeTab === "students") {
      const res = await fetchStudentReport(token, {
        search: studentSearch || undefined,
        status: studentStatus || undefined,
        page: studentPagination.page,
        limit: studentPagination.limit,
      });
      if (res.error) setErrorMessage(res.error);
      setStudents(res.students);
      setStudentPagination(res.pagination);
    } else if (activeTab === "occupancy") {
      const res = await fetchOccupancyReport(token);
      if (res.error) setErrorMessage(res.error);
      setOccupancyHostels(res.hostels);
      setOccupancyOverall(res.overall);
    } else if (activeTab === "finances") {
      const res = await fetchFinanceReport(token);
      if (res.error) setErrorMessage(res.error);
      setFinanceData(res.data);
    } else if (activeTab === "mess") {
      const res = await fetchMessReport(token);
      if (res.error) setErrorMessage(res.error);
      setMessMetrics(res.dailyMetrics);
    }

    setLoading(false);
  }, [activeTab, token, studentSearch, studentStatus, studentPagination.page, studentPagination.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadCsv = async () => {
    setDownloading(true);
    const res = await downloadReportCsv(token, activeTab);
    setDownloading(false);
    if (!res.success && res.error) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              Administrative Reports &amp; Exports
            </h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              CSV Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Filter, inspect, and export university hostel operational datasets with server-side authorization
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={downloading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition active:scale-95 min-h-[44px]"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating CSV...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export {activeTab.toUpperCase()} to CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Switcher - Touch scrollable on mobile */}
      <div className="flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
        <button
          onClick={() => {
            setActiveTab("students");
            setStudentPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "students"
              ? "border-indigo-500 text-white bg-slate-900/50 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Student Directory</span>
        </button>

        <button
          onClick={() => setActiveTab("occupancy")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "occupancy"
              ? "border-indigo-500 text-white bg-slate-900/50 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Hostel Occupancy</span>
        </button>

        <button
          onClick={() => setActiveTab("finances")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "finances"
              ? "border-indigo-500 text-white bg-slate-900/50 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Financial Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("mess")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "mess"
              ? "border-indigo-500 text-white bg-slate-900/50 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Mess Attendance</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Students Report */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by student ID or email..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[40px]"
              />
            </div>
            <select
              value={studentStatus}
              onChange={(e) => setStudentStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none min-h-[40px]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Hostel</th>
                    <th className="px-4 py-3">Room / Bed</th>
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 py-3 text-right">Rent</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No student records match the given filter criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-850/50 transition">
                        <td className="px-4 py-3 font-mono font-medium text-white">{s.studentId}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.email}</div>
                        </td>
                        <td className="px-4 py-3">{s.hostelName}</td>
                        <td className="px-4 py-3 font-mono">
                          {s.roomNumber !== "-" ? `${s.roomNumber}-${s.bedCode}` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.contractStatus === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {s.contractStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">₹{s.monthlyRent.toLocaleString()}</td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            s.outstandingDues > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          ₹{s.outstandingDues.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop Pagination */}
            <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
              <span>Showing {students.length} of {studentPagination.total} residents</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={studentPagination.page <= 1}
                  onClick={() => setStudentPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="rounded p-1 hover:bg-slate-800 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-mono">
                  Page {studentPagination.page} of {studentPagination.totalPages}
                </span>
                <button
                  disabled={studentPagination.page >= studentPagination.totalPages}
                  onClick={() => setStudentPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="rounded p-1 hover:bg-slate-800 disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card View (< 768px) - Highly readable, zero horizontal squeeze */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                <p className="text-xs">Loading student records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40 text-xs">
                No student records match filter.
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{s.studentId} • {s.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                        s.contractStatus === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {s.contractStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 text-[11px]">Hostel</p>
                      <p className="font-semibold text-slate-200 truncate">{s.hostelName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Room / Bed</p>
                      <p className="font-mono text-slate-200 font-semibold truncate">
                        {s.roomNumber !== "-" ? `${s.roomNumber} (${s.bedCode})` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Monthly Rent</p>
                      <p className="font-mono text-slate-200 font-semibold">₹{s.monthlyRent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Outstanding Dues</p>
                      <p
                        className={`font-mono font-bold ${
                          s.outstandingDues > 0 ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        ₹{s.outstandingDues.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Mobile Pagination Controls */}
            {students.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
                <span className="text-center sm:text-left">
                  Showing {students.length} of {studentPagination.total} residents
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={studentPagination.page <= 1}
                    onClick={() => setStudentPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="font-mono px-2">
                    {studentPagination.page} / {studentPagination.totalPages}
                  </span>
                  <button
                    disabled={studentPagination.page >= studentPagination.totalPages}
                    onClick={() => setStudentPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Occupancy Report */}
      {activeTab === "occupancy" && (
        <div className="space-y-4">
          {occupancyOverall && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-[11px] sm:text-xs text-slate-400">Total Bed Capacity</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">{occupancyOverall.totalCapacity}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-400">Occupied Beds</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">{occupancyOverall.occupiedBeds}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-400">Available Vacancies</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-indigo-400 mt-0.5">{occupancyOverall.availableBeds}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-400">Campus Occupancy</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">{occupancyOverall.occupancyPercentage}%</p>
              </div>
            </div>
          )}

          {/* Desktop Occupancy Table (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Hostel Block</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 text-right">Total Rooms</th>
                  <th className="px-4 py-3 text-right">Total Capacity</th>
                  <th className="px-4 py-3 text-right">Occupied Beds</th>
                  <th className="px-4 py-3 text-right">Vacant Beds</th>
                  <th className="px-4 py-3 text-right">Occupancy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {occupancyHostels.map((h) => (
                  <tr key={h.hostelId} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3 font-semibold text-white">{h.name}</td>
                    <td className="px-4 py-3 font-mono text-indigo-300">{h.code}</td>
                    <td className="px-4 py-3 text-right font-mono">{h.totalRooms}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{h.totalCapacity}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">{h.occupiedBeds}</td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-400">{h.availableBeds}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{h.occupancyPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Occupancy Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {occupancyHostels.map((h) => (
              <div
                key={h.hostelId}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div>
                    <p className="font-bold text-white text-sm">{h.name}</p>
                    <p className="text-[11px] font-mono text-indigo-300 font-semibold">{h.code}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                    {h.occupancyPercentage}% Occupied
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400 text-[11px]">Total Rooms</p>
                    <p className="font-mono text-white font-semibold">{h.totalRooms}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Total Capacity</p>
                    <p className="font-mono text-white font-semibold">{h.totalCapacity} Beds</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Occupied</p>
                    <p className="font-mono text-emerald-400 font-bold">{h.occupiedBeds}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Vacancies</p>
                    <p className="font-mono text-indigo-400 font-bold">{h.availableBeds}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Finance Report */}
      {activeTab === "finances" && financeData && (
        <div className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-400">Total Billed Charges</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-white mt-1">₹{financeData.summary.totalCharges.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-400">Verified Collections (Paid)</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 mt-1">₹{financeData.summary.totalPayments.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-400">Disbursed Refunds</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-slate-300 mt-1">₹{financeData.summary.totalRefunds.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <p className="text-[11px] sm:text-xs text-slate-400">Net Outstanding Dues</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-amber-400 mt-1">₹{financeData.summary.outstandingBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Charges by Category</h4>
              <div className="space-y-2">
                {financeData.chargeBreakdown.map((cb, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/60 gap-2">
                    <span className="text-slate-300 truncate">{cb.chargeType} ({cb.count} inv.)</span>
                    <span className="font-mono font-bold text-white flex-shrink-0">₹{cb.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payment Method Breakdown</h4>
              <div className="space-y-2">
                {financeData.paymentMethodBreakdown.map((pm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/60 gap-2">
                    <span className="text-slate-300 truncate">{pm.method} ({pm.count} rec.)</span>
                    <span className="font-mono font-bold text-emerald-400 flex-shrink-0">₹{pm.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mess Report */}
      {activeTab === "mess" && (
        <div className="space-y-4">
          {/* Desktop Mess Table (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Meal Date</th>
                  <th className="px-4 py-3 text-right">Total Residents</th>
                  <th className="px-4 py-3 text-right">Dine-In</th>
                  <th className="px-4 py-3 text-right">Tiffin</th>
                  <th className="px-4 py-3 text-right">Explicit</th>
                  <th className="px-4 py-3 text-right">Default</th>
                  <th className="px-4 py-3 text-right">Average Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {messMetrics.map((m) => (
                  <tr key={m.mealDate} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{m.mealDate}</td>
                    <td className="px-4 py-3 text-right font-mono">{m.totalResidents}</td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-400 font-bold">{m.confirmedDineIn}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-400 font-bold">{m.confirmedTiffin}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{m.explicitSelections}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{m.defaultSelections}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                      {m.averageRating ? `${m.averageRating} ★` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Mess Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {messMetrics.map((m) => (
              <div
                key={m.mealDate}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <p className="font-mono font-bold text-white text-sm">{m.mealDate}</p>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {m.averageRating ? `${m.averageRating} ★ Rating` : "No ratings"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400 text-[11px]">Residents</p>
                    <p className="font-mono text-white font-semibold">{m.totalResidents}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Total Headcount</p>
                    <p className="font-mono text-white font-semibold">{m.confirmedDineIn + m.confirmedTiffin}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Dine-In Count</p>
                    <p className="font-mono text-indigo-400 font-bold">{m.confirmedDineIn}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Packed Tiffins</p>
                    <p className="font-mono text-amber-400 font-bold">{m.confirmedTiffin}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
