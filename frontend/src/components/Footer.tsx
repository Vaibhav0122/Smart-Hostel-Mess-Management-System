import React from "react";
import { GraduationCap, Heart, Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 sm:mt-16 border-t border-slate-800/80 bg-slate-950/70 py-6 sm:py-8 text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 lg:px-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <GraduationCap className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <span>BTech CSE (AI &amp; ML) Capstone Project</span>
          </div>
          <span className="hidden sm:inline text-slate-600">&bull;</span>
          <span className="text-slate-400">Smart Hostel &amp; Mess Management System</span>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Shield className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span>RBAC &amp; Transactions Verified</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 flex-shrink-0" />
            <span>MERN</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
