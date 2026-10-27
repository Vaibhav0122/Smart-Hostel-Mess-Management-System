import React, { useState, useEffect } from "react";
import { loginApi, AuthUser } from "../services/api";
import { Lock, Mail, AlertCircle, X, Shield, User, Loader2 } from "lucide-react";

export type AccountType = "student" | "admin";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialAccountType?: AccountType;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialAccountType = "student",
}) => {
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial account type when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccountType(initialAccountType);
      setErrorMessage(null);
    }
  }, [isOpen, initialAccountType]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter both your login identifier and password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await loginApi({ identifier: identifier.trim(), password });
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.user) {
      onLoginSuccess(result.user);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md my-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl max-h-[95vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Lock className="h-6 w-6" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
            Sign In to NESTORA
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {accountType === "student"
              ? "Access your room details, dining choices, and fee balance."
              : "Access hostel administration, room management, and reports."}
          </p>
        </div>

        {/* Account Type Segmented Switcher */}
        <div
          role="tablist"
          aria-label="Select account type"
          className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={accountType === "student"}
            onClick={() => {
              setAccountType("student");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              accountType === "student"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Student Sign In</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={accountType === "admin"}
            onClick={() => {
              setAccountType("admin");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              accountType === "admin"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Sign In</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
            <span className="break-words font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {accountType === "student" ? "Email Address or Student ID" : "Administrator Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  accountType === "student"
                    ? "student@nestora.local or STU-202610001"
                    : "admin@nestora.local"
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-3 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition active:scale-[0.98] min-h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>
                {accountType === "student"
                  ? "Sign In as Student"
                  : "Sign In as Administrator"}
              </span>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Protected by role-based authorization and secure session management.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
