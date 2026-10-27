import React from "react";
import { Building2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 bg-white py-8 text-xs text-slate-600">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">NESTORA</span>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-slate-500 hidden sm:inline">Simplifying hostel accommodation and mess management.</span>
          </div>

          <p className="text-slate-500 text-[11px] font-medium">
            &copy; 2026 NESTORA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
