import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { SystemStatusCard } from "./components/SystemStatusCard";
import { ArchitectureOverview } from "./components/ArchitectureOverview";
import { Footer } from "./components/Footer";
import { fetchBackendHealth, HealthResponseData } from "./services/api";
import { Sparkles, Terminal } from "lucide-react";

export const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [healthData, setHealthData] = useState<HealthResponseData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const result = await fetchBackendHealth();
    setHealthData(result.data);
    setErrorMessage(result.error);
    setLatencyMs(result.latencyMs);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="mb-10 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Phase 2: Project Foundation &amp; Environment Setup</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Smart Hostel &amp; Mess Management System
              </h1>
              <p className="mt-3 text-base text-slate-300 sm:text-lg leading-relaxed">
                A resilient full-stack MERN operations platform engineered with strict TypeScript,
                defense-in-depth security, and MongoDB replica set transactions for hostel administration and student dining.
              </p>
            </div>

            <div className="mt-6 sm:mt-0 flex-shrink-0">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <Terminal className="h-3.5 w-3.5" /> Stack Overview
                </div>
                <div>Frontend: React 18 + Vite + Tailwind</div>
                <div>Backend: Node.js + Express + TS</div>
                <div>Database: MongoDB (Replica Set)</div>
                <div>Testing: Jest (30/30 Passing)</div>
              </div>
            </div>
          </section>

          {/* System Status & Backend Connectivity */}
          <SystemStatusCard
            loading={loading}
            healthData={healthData}
            errorMessage={errorMessage}
            latencyMs={latencyMs}
            onRefresh={checkHealth}
          />

          {/* Architecture Highlights */}
          <ArchitectureOverview />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default App;
