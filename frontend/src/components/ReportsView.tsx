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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
              Administrative Reports &amp; Exports
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              CSV Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filter, inspect, and export university hostel operational datasets with server-side authorization
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={downloading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95 min-h-[42px]"
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
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
        <button
          onClick={() => {
            setActiveTab("students");
            setStudentPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/70 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>Student Directory</span>
        </button>

        <button
          onClick={() => setActiveTab("occupancy")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "occupancy"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/70 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building className="h-4 w-4 flex-shrink-0" />
          <span>Hostel Occupancy</span>
        </button>

        <button
          onClick={() => setActiveTab("finances")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "finances"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/70 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span>Financial Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("mess")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[42px] ${
            activeTab === "mess"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/70 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4 flex-shrink-0" />
          <span>Mess Attendance</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Students Report */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by student ID, name, or email..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 min-h-[42px]"
              />
            </div>
            <select
              value={studentStatus}
              onChange={(e) => setStudentStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 min-h-[42px]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Student ID</th>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Hostel</th>
                    <th className="px-4 py-3.5">Room / Bed</th>
                    <th className="px-4 py-3.5">Contract</th>
                    <th className="px-4 py-3.5 text-right">Rent</th>
                    <th className="px-4 py-3.5 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        No student records match the given filter criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{s.studentId}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.email}</div>
                        </td>
                        <td className="px-4 py-3.5 font-medium">{s.hostelName}</td>
                        <td className="px-4 py-3.5 font-mono">
                          {s.roomNumber !== "-" ? `${s.roomNumber}-${s.bedCode}` : "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              s.contractStatus === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {s.contractStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-medium">₹{s.monthlyRent.toLocaleString()}</td>
                        <td
                          className={`px-4 py-3.5 text-right font-mono font-bold ${
                            s.outstandingDues > 0 ? "text-amber-600" : "text-emerald-600"
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
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
              <span className="font-medium">Showing {students.length} of {studentPagination.total} residents</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={studentPagination.page <= 1}
                  onClick={() => setStudentPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="rounded-lg border border-slate-200 bg-white p-1 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-mono font-semibold">
                  Page {studentPagination.page} of {studentPagination.totalPages}
                </span>
                <button
                  disabled={studentPagination.page >= studentPagination.totalPages}
                  onClick={() => setStudentPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="rounded-lg border border-slate-200 bg-white p-1 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-2xl bg-white shadow-xs">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs font-semibold">Loading student records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border border-slate-200 rounded-2xl bg-white text-xs">
                No student records match filter.
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{s.studentId} &bull; {s.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                        s.contractStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {s.contractStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500 text-[11px] font-medium">Hostel</p>
                      <p className="font-bold text-slate-800 truncate mt-0.5">{s.hostelName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] font-medium">Room / Bed</p>
                      <p className="font-mono text-slate-800 font-bold truncate mt-0.5">
                        {s.roomNumber !== "-" ? `${s.roomNumber} (${s.bedCode})` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] font-medium">Monthly Rent</p>
                      <p className="font-mono text-slate-900 font-bold mt-0.5">₹{s.monthlyRent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] font-medium">Outstanding Dues</p>
                      <p
                        className={`font-mono font-bold mt-0.5 ${
                          s.outstandingDues > 0 ? "text-amber-600" : "text-emerald-600"
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xs">
                <span className="text-center sm:text-left font-medium">
                  Showing {students.length} of {studentPagination.total} residents
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={studentPagination.page <= 1}
                    onClick={() => setStudentPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold hover:bg-slate-100 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="font-mono px-2 font-bold">
                    {studentPagination.page} / {studentPagination.totalPages}
                  </span>
                  <button
                    disabled={studentPagination.page >= studentPagination.totalPages}
                    onClick={() => setStudentPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold hover:bg-slate-100 disabled:opacity-40"
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
        <div className="space-y-5">
          {occupancyOverall && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Bed Capacity</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">{occupancyOverall.totalCapacity}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Occupied Beds</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1">{occupancyOverall.occupiedBeds}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Available Vacancies</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-indigo-600 mt-1">{occupancyOverall.availableBeds}</p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Campus Occupancy</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">{occupancyOverall.occupancyPercentage}%</p>
              </div>
            </div>
          )}

          {/* Desktop Occupancy Table (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Hostel Block</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5 text-right">Total Rooms</th>
                  <th className="px-4 py-3.5 text-right">Total Capacity</th>
                  <th className="px-4 py-3.5 text-right">Occupied Beds</th>
                  <th className="px-4 py-3.5 text-right">Vacant Beds</th>
                  <th className="px-4 py-3.5 text-right">Occupancy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {occupancyHostels.map((h) => (
                  <tr key={h.hostelId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{h.name}</td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-indigo-700">{h.code}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{h.totalRooms}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium">{h.totalCapacity}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-bold">{h.occupiedBeds}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-indigo-600 font-medium">{h.availableBeds}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{h.occupancyPercentage}%</td>
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
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                    <p className="text-[11px] font-mono text-indigo-700 font-bold">{h.code}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {h.occupancyPercentage}% Occupied
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Total Rooms</p>
                    <p className="font-mono text-slate-900 font-bold mt-0.5">{h.totalRooms}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Total Capacity</p>
                    <p className="font-mono text-slate-900 font-bold mt-0.5">{h.totalCapacity} Beds</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Occupied</p>
                    <p className="font-mono text-emerald-700 font-bold mt-0.5">{h.occupiedBeds}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Vacancies</p>
                    <p className="font-mono text-indigo-600 font-bold mt-0.5">{h.availableBeds}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Finance Report */}
      {activeTab === "finances" && financeData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Billed Charges</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 mt-1">₹{financeData.summary.totalCharges.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Verified Collections (Paid)</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-emerald-700 mt-1">₹{financeData.summary.totalPayments.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Disbursed Refunds</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-slate-700 mt-1">₹{financeData.summary.totalRefunds.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Net Outstanding Dues</p>
              <p className="text-lg sm:text-xl font-extrabold font-mono text-amber-600 mt-1">₹{financeData.summary.outstandingBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Charges by Category</h4>
              <div className="space-y-2">
                {financeData.chargeBreakdown.map((cb, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                    <span className="text-slate-700 font-medium truncate">{cb.chargeType} ({cb.count} inv.)</span>
                    <span className="font-mono font-bold text-slate-900 flex-shrink-0">₹{cb.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment Method Breakdown</h4>
              <div className="space-y-2">
                {financeData.paymentMethodBreakdown.map((pm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                    <span className="text-slate-700 font-medium truncate">{pm.method} ({pm.count} rec.)</span>
                    <span className="font-mono font-bold text-emerald-700 flex-shrink-0">₹{pm.totalAmount.toLocaleString()}</span>
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
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Meal Date</th>
                  <th className="px-4 py-3.5 text-right">Total Residents</th>
                  <th className="px-4 py-3.5 text-right">Dine-In</th>
                  <th className="px-4 py-3.5 text-right">Tiffin</th>
                  <th className="px-4 py-3.5 text-right">Explicit</th>
                  <th className="px-4 py-3.5 text-right">Default</th>
                  <th className="px-4 py-3.5 text-right">Average Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {messMetrics.map((m) => (
                  <tr key={m.mealDate} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{m.mealDate}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{m.totalResidents}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-indigo-700 font-bold">{m.confirmedDineIn}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-amber-700 font-bold">{m.confirmedTiffin}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">{m.explicitSelections}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">{m.defaultSelections}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-600">
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
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <p className="font-mono font-bold text-slate-900 text-sm">{m.mealDate}</p>
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {m.averageRating ? `${m.averageRating} ★ Rating` : "No ratings"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Residents</p>
                    <p className="font-mono text-slate-900 font-bold mt-0.5">{m.totalResidents}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Total Headcount</p>
                    <p className="font-mono text-slate-900 font-bold mt-0.5">{m.confirmedDineIn + m.confirmedTiffin}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Dine-In Count</p>
                    <p className="font-mono text-indigo-700 font-bold mt-0.5">{m.confirmedDineIn}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium">Packed Tiffins</p>
                    <p className="font-mono text-amber-700 font-bold mt-0.5">{m.confirmedTiffin}</p>
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
