export interface HealthDatabaseStatus {
  connected: boolean;
  replicaSetEnabled: boolean;
  host?: string;
  name?: string;
}

export interface HealthResponseData {
  status: "HEALTHY" | "DEGRADED";
  timestamp: string;
  uptimeSeconds: number;
  nodeVersion: string;
  database: HealthDatabaseStatus;
}

export interface HealthApiResponse {
  success: boolean;
  data: HealthResponseData;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "STUDENT" | "HOSTEL_ADMIN" | "SUPER_ADMIN" | "ACCOUNTS_MANAGER" | "MESS_STAFF" | "SECURITY_STAFF";
  status: string;
  studentId?: string;
}

export interface AdminMetrics {
  totalStudents: number;
  totalHostels: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  financials: {
    totalChargesAmount: number;
    totalPaidAmount: number;
    totalRefundedAmount: number;
    totalPendingDues: number;
    pendingChargesCount: number;
  };
  messSummary: {
    todayDate: string;
    todayLunchDineIn: number;
    todayLunchTiffin: number;
    activeResidentsCount: number;
    averageRating: number | null;
  };
}

export interface StudentSummary {
  student: {
    id: string;
    studentId?: string | null;
    email: string;
    status: string;
    fullName?: string;
    phone?: string;
    roomNumber?: string;
    bedCode?: string;
    hostelName?: string;
  };
  allocation: {
    hasAllocation: boolean;
    hostelId?: string;
    hostelName?: string;
    roomNumber?: string;
    bedCode?: string;
    startDate?: string;
  };
  contract: {
    hasContract: boolean;
    status?: string;
    startDate?: string;
    endDate?: string;
    monthlyRentAmount?: number;
    securityDepositAmount?: number;
    lockInUntilDate?: string;
  };
  financials: {
    totalCharges: number;
    totalPaid: number;
    totalRefunded: number;
    outstandingBalance: number;
    recentTransactions: Array<{
      id: string;
      receiptNumber: string;
      amountPaid: number;
      paymentDate: string;
      paymentMethod: string;
    }>;
  };
  mess: {
    todayDate: string;
    cutoffPassed: boolean;
    todaySelection: {
      selection: "DINE_IN" | "TIFFIN" | string;
      isDefault: boolean;
      isOverridden: boolean;
    };
    upcomingMenus: Array<{
      id: string;
      mealDate: string;
      mealType: string;
      title: string;
      items: string[];
      isSpecialMeal: boolean;
    }>;
  };
}

export interface StudentReportItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  hostelName: string;
  roomNumber: string;
  bedCode: string;
  contractStatus: string;
  monthlyRent: number;
  outstandingDues: number;
}

export interface OccupancyHostelItem {
  hostelId: string;
  name: string;
  code: string;
  totalRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
}

export interface FinanceReportData {
  summary: {
    totalCharges: number;
    totalPayments: number;
    totalRefunds: number;
    outstandingBalance: number;
  };
  chargeBreakdown: Array<{ chargeType: string; totalAmount: number; count: number }>;
  paymentMethodBreakdown: Array<{ method: string; totalAmount: number; count: number }>;
}

export interface MessReportItem {
  mealDate: string;
  totalResidents: number;
  confirmedDineIn: number;
  confirmedTiffin: number;
  explicitSelections: number;
  defaultSelections: number;
  averageRating: number | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearStoredToken(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export function getStoredUser(): AuthUser | null {
  const data = localStorage.getItem("auth_user");
  if (!data) return null;
  try {
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function fetchBackendHealth(): Promise<{
  data: HealthResponseData | null;
  error: string | null;
  latencyMs: number;
}> {
  const startTime = performance.now();
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/health`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      try {
        const body = (await response.json()) as HealthApiResponse;
        if (body && body.data) {
          return { data: body.data, error: null, latencyMs };
        }
      } catch {
        // failed parse
      }
      return {
        data: null,
        error: `Backend responded with HTTP ${response.status} (${response.statusText})`,
        latencyMs,
      };
    }

    const payload = (await response.json()) as HealthApiResponse;
    return { data: payload.data, error: null, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Unable to reach backend API. Ensure the server is running on " + API_BASE_URL
        : err?.message || "An unknown network error occurred.";
    return { data: null, error: message, latencyMs };
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginApi(credentials: {
  identifier?: string;
  email?: string;
  password: string;
}): Promise<{
  token?: string;
  user?: AuthUser;
  error?: string;
}> {
  try {
    const identifier = (credentials.identifier || credentials.email || "").trim();
    const url = `${API_BASE_URL.replace(/\/$/, "")}/auth/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password: credentials.password,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      if (body.error?.details && Array.isArray(body.error.details) && body.error.details.length > 0) {
        const fieldErrors = body.error.details.map((d: any) => d.message).join(" ");
        return { error: fieldErrors || body.error.message || "Invalid credentials." };
      }
      return { error: body.error?.message || "Login failed. Please check credentials." };
    }

    const token = body.data?.accessToken;
    const user = body.data?.user;
    if (token && user) {
      setStoredToken(token);
      setStoredUser(user);
    }
    return { token, user };
  } catch (err: any) {
    return { error: err.message || "Network error while connecting to auth service." };
  }
}

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

export async function fetchAdminMetrics(token: string, hostelId?: string): Promise<{
  data: AdminMetrics | null;
  error: string | null;
}> {
  try {
    let url = `${API_BASE_URL.replace(/\/$/, "")}/dashboard/admin-metrics`;
    if (hostelId) {
      url += `?hostelId=${encodeURIComponent(hostelId)}`;
    }
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return { data: null, error: body.error?.message || `HTTP ${res.status}: Failed to fetch admin metrics` };
    }
    return { data: body.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to fetch admin metrics." };
  }
}

export async function fetchStudentSummary(token: string): Promise<{
  data: StudentSummary | null;
  error: string | null;
}> {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/dashboard/student-summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return { data: null, error: body.error?.message || `HTTP ${res.status}: Failed to load student dashboard` };
    }
    return { data: body.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load student dashboard." };
  }
}

export async function selectMealChoice(
  token: string,
  mealDate: string,
  selection: "DINE_IN" | "TIFFIN"
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/mess/selection`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mealDate, selection }),
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error?.message || "Failed to save meal selection." };
    }
    return { success: true, message: body.message || "Meal selection updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while saving selection." };
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function fetchStudentReport(
  token: string,
  params: { search?: string; status?: string; page?: number; limit?: number }
): Promise<{
  students: StudentReportItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  error: string | null;
}> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const url = `${API_BASE_URL.replace(/\/$/, "")}/reports/students?${query.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return {
        students: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
        error: body.error?.message || "Failed to load student report",
      };
    }
    return {
      students: body.data.students,
      pagination: body.data.pagination,
      error: null,
    };
  } catch (err: any) {
    return {
      students: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
      error: err.message || "Network error while loading student report.",
    };
  }
}

export async function fetchOccupancyReport(
  token: string,
  hostelId?: string
): Promise<{
  hostels: OccupancyHostelItem[];
  overall: { totalCapacity: number; occupiedBeds: number; availableBeds: number; occupancyPercentage: number };
  error: string | null;
}> {
  try {
    let url = `${API_BASE_URL.replace(/\/$/, "")}/reports/occupancy`;
    if (hostelId) url += `?hostelId=${encodeURIComponent(hostelId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return {
        hostels: [],
        overall: { totalCapacity: 0, occupiedBeds: 0, availableBeds: 0, occupancyPercentage: 0 },
        error: body.error?.message || "Failed to load occupancy report",
      };
    }
    return {
      hostels: body.data.hostels,
      overall: body.data.overall,
      error: null,
    };
  } catch (err: any) {
    return {
      hostels: [],
      overall: { totalCapacity: 0, occupiedBeds: 0, availableBeds: 0, occupancyPercentage: 0 },
      error: err.message || "Network error loading occupancy report.",
    };
  }
}

export async function fetchFinanceReport(
  token: string,
  params?: { startDate?: string; endDate?: string }
): Promise<{
  data: FinanceReportData | null;
  error: string | null;
}> {
  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const url = `${API_BASE_URL.replace(/\/$/, "")}/reports/finances?${query.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return { data: null, error: body.error?.message || "Failed to load financial report" };
    }
    return { data: body.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error loading finance report." };
  }
}

export async function fetchMessReport(
  token: string,
  params?: { startDate?: string; endDate?: string }
): Promise<{
  dailyMetrics: MessReportItem[];
  error: string | null;
}> {
  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const url = `${API_BASE_URL.replace(/\/$/, "")}/reports/mess?${query.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return { dailyMetrics: [], error: body.error?.message || "Failed to load mess report" };
    }
    return { dailyMetrics: body.data.dailyMetrics, error: null };
  } catch (err: any) {
    return { dailyMetrics: [], error: err.message || "Network error loading mess report." };
  }
}

export async function downloadReportCsv(
  token: string,
  type: "students" | "occupancy" | "finances" | "mess"
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/reports/export?type=${type}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { success: false, error: `Failed to download CSV (HTTP ${res.status})` };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    let filename = `report-${type}.csv`;
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error triggering file download." };
  }
}
