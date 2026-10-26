import React from "react";
import { GraduationCap, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 py-8 text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-400" />
          <span>
            BTech CSE (AI &amp; ML) Capstone Project &bull; Smart Hostel &amp; Mess Management System
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <span>Engineered with</span>
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          <span>using MERN + TypeScript</span>
        </div>
      </div>
    </footer>
  );
};
