import React, { useState, useEffect } from "react";
import { loginApi, AuthUser } from "../services/api";
import { Lock, Mail, AlertCircle, X, Shield, User, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await loginApi({ email, password });
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.user) {
      onLoginSuccess(result.user);
      onClose();
    }
  };

  const setDemoCredentials = (role: "admin" | "student") => {
    if (role === "admin") {
      setEmail("admin@hostel.edu");
      setPassword("Admin@123456");
    } else {
      setEmail("student1@hostel.edu");
      setPassword("Student@123456");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md my-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl shadow-indigo-950/50 max-h-[95vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 sm:mb-6 text-center">
          <div className="mx-auto mb-2.5 sm:mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
            <Lock className="h-6 w-6" />
          </div>
          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Sign In to Hostel Portal
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            Authenticate to access your role-based dashboard, ledger, &amp; dining choices
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hostel.edu"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-9 pr-3 text-base sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-9 pr-3 text-base sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[44px]"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition active:scale-[0.98] min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating with Server...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-400 mb-2 font-medium">Quick Demo Credentials:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials("admin")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/60 py-2 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95 min-h-[38px]"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("student")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/60 py-2 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95 min-h-[38px]"
            >
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Student Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
