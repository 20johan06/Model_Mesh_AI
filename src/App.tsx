import React from 'react';
import { ModelMeshProvider, useModelMesh } from './context/ModelMeshContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

import { LandingPage } from './components/pages/LandingPage';
import { PlaygroundPage } from './components/pages/PlaygroundPage';
import { RoutingEnginePage } from './components/pages/RoutingEnginePage';
import { DashboardPage } from './components/pages/DashboardPage';
import { ModelRegistryPage } from './components/pages/ModelRegistryPage';
import { ArchitecturePage } from './components/pages/ArchitecturePage';

const MainContent: React.FC = () => {
  const { activeTab } = useModelMesh();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-w-0">
      {activeTab === 'landing' && <LandingPage />}
      {activeTab === 'playground' && <PlaygroundPage />}
      {activeTab === 'routing-engine' && <RoutingEnginePage />}
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'registry' && <ModelRegistryPage />}
      {activeTab === 'architecture' && <ArchitecturePage />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <ModelMeshProvider>
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <MobileNav />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <MainContent />
        </div>

        {/* Global Footer */}
        <footer className="w-full border-t border-white/10 py-6 bg-slate-950/60 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">ModelMesh AI</span>
              <span>— Deterministic Multi-LLM Routing Infrastructure</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-slate-200">v2.4 Pro Production Engine</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                99.99% SLA Operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ModelMeshProvider>
  );
};

export default App;
