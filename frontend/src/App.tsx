import React, { useEffect, useState, useCallback } from "react";
import { Navbar, NavTab } from "./components/Navbar";
import { SystemStatusCard } from "./components/SystemStatusCard";
import { ArchitectureOverview } from "./components/ArchitectureOverview";
import { StudentDashboard } from "./components/StudentDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ReportsView } from "./components/ReportsView";
import { AuthModal } from "./components/AuthModal";
import { Footer } from "./components/Footer";
import {
  fetchBackendHealth,
  HealthResponseData,
  AuthUser,
  getStoredToken,
  clearStoredToken,
  getStoredUser,
} from "./services/api";
import { Sparkles, Terminal, Lock, LogIn } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthData, setHealthData] = useState<HealthResponseData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(savedUser);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setLoadingHealth(true);
    const result = await fetchBackendHealth();
    setHealthData(result.data);
    setHealthError(result.error);
    setLatencyMs(result.latencyMs);
    setLoadingHealth(false);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleLoginSuccess = (user: AuthUser) => {
    const t = getStoredToken();
    setToken(t);
    setCurrentUser(user);
    if (user.role === "STUDENT") {
      setActiveTab("student");
    } else {
      setActiveTab("admin");
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setCurrentUser(null);
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <div className="w-full">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8 w-full">
          {/* TAB 1: System Overview & Health */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8">
              {/* Hero Section */}
              <section className="text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-8 bg-gradient-to-b sm:bg-none from-slate-900/40 to-transparent p-4 sm:p-0 rounded-2xl">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">Phase 11: Production-Ready Campus Operations</span>
                  </div>
                  <h1 className="mt-2.5 sm:mt-3 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white break-words">
                    Smart Hostel &amp; Mess Management System
                  </h1>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    An enterprise full-stack MERN operations platform engineered with strict TypeScript,
                    defense-in-depth RBAC, and MongoDB replica set ACID transactions for campus accommodation,
                    automated dining choices, and forensic financial auditing.
                  </p>
                </div>

                <div className="mt-4 sm:mt-0 flex-shrink-0 w-full sm:w-auto">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400 space-y-1.5 shadow-inner">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                      <Terminal className="h-3.5 w-3.5 flex-shrink-0" /> Platform Highlights
                    </div>
                    <div>Student &amp; Admin Dashboards</div>
                    <div>Real-time Mess &amp; Cutoff Engine</div>
                    <div>Financial Ledger &amp; Auditable Invoices</div>
                    <div>Exportable CSV Reporting Suite</div>
                  </div>
                </div>
              </section>

              {/* System Status & Backend Connectivity */}
              <SystemStatusCard
                loading={loadingHealth}
                healthData={healthData}
                errorMessage={healthError}
                latencyMs={latencyMs}
                onRefresh={checkHealth}
              />

              {/* Architecture Highlights */}
              <ArchitectureOverview />
            </div>
          )}

          {/* TAB 2: Student Dashboard */}
          {activeTab === "student" && (
            <div>
              {token ? (
                <StudentDashboard token={token} />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4">
                  <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                    <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Student Sign-In Required</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs sm:max-w-md mx-auto">
                    Sign in with your student credentials to view your allocated room, residency contract,
                    ledger balance, and select your daily lunch Dine-in or packed Tiffin choice.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95 min-h-[44px]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In as Student</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Admin KPI Dashboard */}
          {activeTab === "admin" && (
            <div>
              {token ? (
                <AdminDashboard
                  token={token}
                  onNavigateToReports={() => setActiveTab("reports")}
                />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4">
                  <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                    <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Admin Authentication Required</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs sm:max-w-md mx-auto">
                    Sign in with administrative credentials (`HOSTEL_ADMIN`, `SUPER_ADMIN`, or `ACCOUNTS_MANAGER`)
                    to inspect live database metrics, bed occupancies, and kitchen tallies.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95 min-h-[44px]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In as Administrator</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Reports & CSV Export */}
          {activeTab === "reports" && (
            <div>
              {token ? (
                <ReportsView token={token} />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4">
                  <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                    <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Reports Authorization Required</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs sm:max-w-md mx-auto">
                    Accessing student master records, campus occupancy breakdowns, financial balances,
                    and downloadable CSV exports requires verified administrator credentials.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95 min-h-[44px]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Access Reports</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
