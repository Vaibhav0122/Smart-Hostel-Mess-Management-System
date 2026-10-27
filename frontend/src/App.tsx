import React, { useEffect, useState } from "react";
import { Navbar, NavTab } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ReportsView } from "./components/ReportsView";
import { AuthModal, AccountType } from "./components/AuthModal";
import { Footer } from "./components/Footer";
import {
  AuthUser,
  getStoredToken,
  clearStoredToken,
  getStoredUser,
} from "./services/api";
import { Lock, LogIn } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [modalAccountType, setModalAccountType] = useState<AccountType>("student");

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(savedUser);
    }
  }, []);

  const openAuthModal = (type: AccountType = "student") => {
    setModalAccountType(type);
    setIsAuthModalOpen(true);
  };

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
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <div className="w-full">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          onOpenAuth={openAuthModal}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
          {/* TAB 1: Product Overview & Walkthrough */}
          {activeTab === "overview" && (
            <LandingPage onOpenAuth={openAuthModal} />
          )}

          {/* TAB 2: Student Dashboard */}
          {activeTab === "student" && (
            <div>
              {token ? (
                <StudentDashboard token={token} />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Student Sign-In Required</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Sign in with your student credentials to view your allocated room, residency contract,
                    ledger balance, and select your daily lunch Dine-in or packed Tiffin choice.
                  </p>
                  <button
                    onClick={() => openAuthModal("student")}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition active:scale-[0.98] min-h-[46px]"
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Admin Authentication Required</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Sign in with your administrator account to inspect campus database metrics,
                    room occupancy, and kitchen headcounts.
                  </p>
                  <button
                    onClick={() => openAuthModal("admin")}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition active:scale-[0.98] min-h-[46px]"
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Reports Authorization Required</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Accessing student master records, campus occupancy breakdowns, financial balances,
                    and downloadable CSV exports requires verified administrator credentials.
                  </p>
                  <button
                    onClick={() => openAuthModal("admin")}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition active:scale-[0.98] min-h-[46px]"
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

      {/* Authentication Modal with Role Selector */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialAccountType={modalAccountType}
      />
    </div>
  );
};

export default App;
