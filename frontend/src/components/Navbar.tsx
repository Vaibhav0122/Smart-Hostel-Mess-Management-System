import React, { useState, useEffect } from "react";
import {
  Building2,
  UtensilsCrossed,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  FileSpreadsheet,
  Activity,
  Menu,
  X,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";
import { AuthUser } from "../services/api";

export type NavTab = "overview" | "student" | "admin" | "reports";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems: Array<{
    tab: NavTab;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      tab: "overview",
      label: "System Overview",
      description: "Health checks & architecture",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      tab: "student",
      label: "Student Portal",
      description: "Room, contract, dues & meals",
      icon: <User className="h-4 w-4" />,
    },
    {
      tab: "admin",
      label: "Admin Executive",
      description: "KPIs, occupancy & financials",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      tab: "reports",
      label: "Reports Suite",
      description: "Filtered logs & CSV export",
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => handleTabClick("overview")}
              className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20 hover:scale-105 transition"
              aria-label="Smart Hostel Home"
            >
              <Building2 className="h-5 w-5 text-white" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  Smart Hostel &amp; Mess
                </span>
                <span className="hidden xs:inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">
                Integrated Operations, Room Allocation &amp; Dining Platform
              </p>
            </div>
          </div>

          {/* Desktop Central Navigation Tabs */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 text-xs"
          >
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleTabClick(item.tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === item.tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Section: Desktop User & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Cutoff indicator badge for larger screens */}
            <div className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 lg:flex">
              <UtensilsCrossed className="h-3.5 w-3.5 text-indigo-400" />
              <span>Cutoff:</span>
              <span className="font-mono text-indigo-300 font-semibold">09:30 AM</span>
            </div>

            {/* Desktop Auth Controls */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-xs font-medium text-white truncate max-w-[130px] lg:max-w-[180px]">
                    {currentUser.email}
                  </p>
                  <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition"
                  title="Sign out of current account"
                  aria-label="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
              aria-label={mobileMenuOpen ? "Close navigation drawer" : "Open navigation drawer"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Compact Mobile Tabs Quick Row (Quick 1-tap switching without opening drawer) */}
        <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950/95 px-2 py-1.5 overflow-x-auto no-scrollbar gap-1 justify-between text-xs">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => handleTabClick(item.tab)}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-medium text-center transition truncate text-[11px] ${
                activeTab === item.tab
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      {/* Accessible Mobile Slide-over Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Smart Hostel</h3>
                <p className="text-[10px] text-slate-400">Campus Operations Portal</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Card or Sign In Button inside Mobile Drawer */}
          {currentUser ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-300 uppercase">
                      {currentUser.role}
                    </span>
                    {currentUser.studentId && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentUser.studentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In with Credentials</span>
            </button>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Menu Navigation
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabClick(item.tab)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p
                        className={`text-[10px] ${
                          isActive ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Mess Cutoff Info */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 flex items-center gap-2.5 text-xs text-slate-300">
            <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-200">Daily Dining Cutoff</p>
              <p className="text-[10px] text-slate-400 font-mono">09:30 AM (Asia/Kolkata)</p>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="pt-4 border-t border-slate-800">
          {currentUser ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out of Account</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Dual-Token JWT &amp; Role Guard Active</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
