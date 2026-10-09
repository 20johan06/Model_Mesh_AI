import React from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { TabType } from '../../context/ModelMeshContext';
import {
  Home,
  Terminal,
  Cpu,
  BarChart3,
  Layers,
  Network,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, strategy, models, requestLogs } = useModelMesh();

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'landing',
      label: 'Overview & Features',
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'playground',
      label: 'AI Playground',
      icon: <Terminal className="w-4 h-4" />,
      badge: 'Interactive'
    },
    {
      id: 'routing-engine',
      label: 'Routing Engine',
      icon: <Cpu className="w-4 h-4" />
    },
    {
      id: 'dashboard',
      label: 'Analytics & Logs',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: `${requestLogs.length}`
    },
    {
      id: 'registry',
      label: 'Model Registry',
      icon: <Layers className="w-4 h-4" />,
      badge: `${models.filter(m => m.active).length} Active`
    },
    {
      id: 'architecture',
      label: 'System Topology',
      icon: <Network className="w-4 h-4" />
    }
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-white/10 bg-slate-950/60 min-h-[calc(100vh-4rem)] p-4">
      <div className="flex flex-col h-full justify-between gap-6">
        {/* Navigation Menu */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Engine Status Widget */}
        <div className="glass-panel p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Active Engine
            </span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
              {strategy}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic multi-criteria scoring algorithm configured with active rules & latency budget.
          </p>

          <button
            onClick={() => setActiveTab('playground')}
            className="w-full text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded-lg py-1.5 flex items-center justify-center gap-1 transition"
          >
            <span>Run Quick Test</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
