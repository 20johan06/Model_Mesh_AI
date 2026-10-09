import React from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { ThemeType } from '../../context/ModelMeshContext';
import type { RoutingStrategy } from '../../types';
import {
  Cpu,
  Zap,
  Activity,
  DollarSign,
  Clock,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    theme,
    setTheme,
    strategy,
    setStrategy,
    globalMetrics,
    resetDefaults,
    setActiveTab
  } = useModelMesh();

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrategy(e.target.value as RoutingStrategy);
  };

  const toggleThemeNext = () => {
    const themes: ThemeType[] = ['dark', 'light', 'cyberpunk'];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIdx]);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      {/* Simulation Disclaimer Banner */}
      <div className="bg-indigo-950/70 border-b border-indigo-500/20 px-4 py-1.5 text-xs text-indigo-200 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-white">ModelMesh AI v2.4 Engine:</strong> Deterministic scoring, cost calculations, & SLA routing are live. Model API calls are simulated for demo purposes.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 glow-indigo">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">ModelMesh</span>
              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">AI ROUTER</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Engine Operational
            </p>
          </div>
        </div>

        {/* Global Live Ticker */}
        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 bg-slate-900/60 rounded-full border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Total Queries:</span>
            <span className="font-mono font-semibold text-white">{globalMetrics.totalRequests}</span>
          </div>

          <div className="h-3 w-px bg-white/10"></div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Cost Saved:</span>
            <span className="font-mono font-semibold text-emerald-400">${globalMetrics.totalCostSaved.toFixed(3)}</span>
          </div>

          <div className="h-3 w-px bg-white/10"></div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Avg Latency:</span>
            <span className="font-mono font-semibold text-white">{globalMetrics.avgLatency}ms</span>
          </div>

          <div className="h-3 w-px bg-white/10"></div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">SLA:</span>
            <span className="font-mono font-semibold text-amber-300">{globalMetrics.accuracySLA}%</span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Strategy Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden md:inline">Strategy:</span>
            <select
              value={strategy}
              onChange={handleStrategyChange}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="balanced" className="bg-slate-900">Balanced (Smart)</option>
              <option value="cost" className="bg-slate-900">Cost-Optimized</option>
              <option value="latency" className="bg-slate-900">Low Latency</option>
              <option value="quality" className="bg-slate-900">Max Quality</option>
              <option value="custom" className="bg-slate-900">Custom Rules</option>
            </select>
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleThemeNext}
            title={`Current theme: ${theme}. Click to switch.`}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
            {theme === 'cyberpunk' && <Zap className="w-4 h-4 text-pink-500" />}
          </button>

          {/* Reset Defaults */}
          <button
            onClick={resetDefaults}
            title="Reset engine state to defaults"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* CTA Playground */}
          <button
            onClick={() => setActiveTab('playground')}
            className="btn-primary text-xs font-semibold py-1.5 px-2.5 sm:px-3 shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Playground</span>
            <span className="sm:hidden">Playground</span>
          </button>
        </div>
      </div>
    </header>
  );
};
