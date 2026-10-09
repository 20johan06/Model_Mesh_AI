import React from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { TabType } from '../../context/ModelMeshContext';
import {
  Home,
  Terminal,
  Cpu,
  BarChart3,
  Layers,
  Network
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useModelMesh();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'playground', label: 'Playground', icon: <Terminal className="w-4 h-4" /> },
    { id: 'routing-engine', label: 'Engine', icon: <Cpu className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'registry', label: 'Registry', icon: <Layers className="w-4 h-4" /> },
    { id: 'architecture', label: 'Topology', icon: <Network className="w-4 h-4" /> }
  ];

  return (
    <nav className="md:hidden w-full bg-slate-950/90 border-t border-b border-white/10 px-2 py-1.5 overflow-x-auto max-w-full">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
