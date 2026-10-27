import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  FileSpreadsheet,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { AuthUser } from "../services/api";

export type NavTab = "overview" | "student" | "admin" | "reports";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AuthUser | null;
  onOpenAuth: (defaultType?: "student" | "admin") => void;
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

  // Determine available tabs based on authentication state
  const getNavItems = (): Array<{
    tab: NavTab;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> => {
    const items: Array<{
      tab: NavTab;
      label: string;
      description: string;
      icon: React.ReactNode;
    }> = [];

    // Authenticated role-based tabs only
    if (currentUser) {
      if (currentUser.role === "STUDENT") {
        items.push({
          tab: "student",
          label: "Student Portal",
          description: "Room, contract, dues & meals",
          icon: <User className="h-4 w-4" />,
        });
      } else {
        items.push(
          {
            tab: "admin",
            label: "Admin Portal",
            description: "KPIs, occupancy & financials",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            tab: "reports",
            label: "Reports",
            description: "Filtered logs & CSV export",
            icon: <FileSpreadsheet className="h-4 w-4" />,
          }
        );
      }
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md shadow-[0_2px_12px_rgba(15,23,42,0.03)] transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo & Title */}
          <button
            onClick={() => handleTabClick("overview")}
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-hidden group min-w-0"
            aria-label="NESTORA Home"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition truncate block leading-tight">
                NESTORA
              </span>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate leading-tight hidden xs:block">
                Smart Hostel Living
              </p>
            </div>
          </button>

          {/* Desktop Navigation (Only rendered when user is authenticated) */}
          {currentUser && navItems.length > 0 && (
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/60 p-1 text-xs"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleTabClick(item.tab)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
                      isActive
                        ? "bg-white text-indigo-600 shadow-xs font-semibold border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Section: Auth Controls / Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px] lg:max-w-[180px]">
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {currentUser.role}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shadow-xs"
                    title="Sign out of current account"
                    aria-label="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>

                {/* Mobile Hamburger Drawer Button (shown when authenticated) */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-xs"
                  aria-label={mobileMenuOpen ? "Close navigation drawer" : "Open navigation drawer"}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenAuth()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Mobile Tabs Bar (Shown only when authenticated and multiple tabs exist) */}
        {currentUser && navItems.length > 1 && (
          <div className="flex md:hidden border-t border-slate-200 bg-slate-50 px-2 py-1.5 overflow-x-auto no-scrollbar gap-1 justify-between text-xs">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabClick(item.tab)}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-medium text-center transition truncate text-[11px] ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200/60"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Accessible Mobile Slide-over Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm bg-white border-l border-slate-200 shadow-xl p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">NESTORA</h3>
                <p className="text-[10px] text-slate-500">Smart Hostel Living</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Card or Sign In Button inside Mobile Drawer */}
          {currentUser ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 uppercase">
                      {currentUser.role}
                    </span>
                    {currentUser.studentId && (
                      <span className="text-[10px] font-mono text-slate-500">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Navigation
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabClick(item.tab)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p
                        className={`text-[10px] ${
                          isActive ? "text-indigo-600" : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${
                      isActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="pt-4 border-t border-slate-200">
          {currentUser ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          ) : (
            <p className="text-center text-[11px] text-slate-500 font-medium">
              NESTORA — Smart Hostel Living
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
