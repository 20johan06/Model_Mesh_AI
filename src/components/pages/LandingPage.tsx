import React, { useState } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import {
  Zap,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab, executeRouting, models } = useModelMesh();
  const [quickPrompt, setQuickPrompt] = useState('Refactor this async SQL query pool to use Tokio and Rust.');
  const [quickResultModel, setQuickResultModel] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // ROI Calculator State
  const [monthlyTokensMillions, setMonthlyTokensMillions] = useState(100);
  const [gpt4oRatio, setGpt4oRatio] = useState(80);

  const handleQuickTest = () => {
    setIsTestRunning(true);
    setTimeout(() => {
      const res = executeRouting(quickPrompt);
      setQuickResultModel(`${res.selectedModel.name} (${res.selectedModel.provider}) • Saved ${res.savingsPercent}% cost`);
      setIsTestRunning(false);
    }, 400);
  };

  // ROI Math calculations
  const baselineCostMonthly = (monthlyTokensMillions * 1000 * 0.00625);
  const routedCostMonthly = baselineCostMonthly * (1 - (gpt4oRatio / 100) * 0.72);
  const monthlySavings = baselineCostMonthly - routedCostMonthly;
  const annualSavings = monthlySavings * 12;

  return (
    <div className="space-y-12 pb-12 fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 md:p-12 border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 via-slate-950 to-slate-950">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Multi-LLM Orchestration Gateway</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Model Routing for <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Frontier AI Infrastructure</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminated single-provider lock-in and slashed token costs by up to 80%. ModelMesh AI automatically analyzes prompt complexity, domain requirements, and SLA bounds to route every request to the optimal LLM deterministically.
          </p>

          {/* Quick Demo Test Input */}
          <div className="pt-2">
            <div className="glass-panel p-2 flex flex-col sm:flex-row items-center gap-2 border-indigo-500/30">
              <div className="relative w-full flex-1">
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Enter any prompt to test routing..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleQuickTest}
                disabled={isTestRunning || !quickPrompt.trim()}
                className="w-full sm:w-auto btn-primary text-xs py-2.5 px-4 font-semibold whitespace-nowrap"
              >
                {isTestRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Evaluating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Simulate Route
                  </span>
                )}
              </button>
            </div>

            {quickResultModel && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <strong>Route Result:</strong> {quickResultModel}
                </span>
                <button
                  onClick={() => setActiveTab('playground')}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View in Playground <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveTab('playground')}
              className="btn-primary py-2.5 px-5 font-semibold text-sm"
            >
              <span>Explore AI Playground</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className="btn-secondary py-2.5 px-5 font-semibold text-sm"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>View System Topology</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel-interactive p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Deterministic Multi-Criteria Routing</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Multi-attribute utility algorithm evaluates cost, SLA latency, quality scores, and custom rule constraints deterministically in sub-5ms.
          </p>
        </div>

        <div className="glass-panel-interactive p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Automated Cost Savings</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Offload standard prompts to lightweight MoE models (DeepSeek V3, Gemini Flash) while reserving GPT-4o & Claude 3.5 Sonnet for deep logic.
          </p>
        </div>

        <div className="glass-panel-interactive p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Failover Cascade Protection</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Automated health monitoring detects rate limits and upstream API latency degradation, seamlessly triggering non-disruptive provider failovers.
          </p>
        </div>
      </section>

      {/* Interactive ROI Savings Calculator */}
      <section className="glass-panel p-8 border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" />
              <span>Interactive ROI Calculator</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Estimate Your Infrastructure Savings</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              ${Math.round(annualSavings).toLocaleString()} / yr
            </div>
            <div className="text-xs text-slate-400">Projected annual cost reduction</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Monthly API Token Volume</span>
                <span className="font-mono text-indigo-400 font-bold">{monthlyTokensMillions} Million Tokens</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={monthlyTokensMillions}
                onChange={(e) => setMonthlyTokensMillions(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>10M tokens</span>
                <span>500M tokens</span>
                <span>1B tokens</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Standard Traffic Routable to Tier-2 Models</span>
                <span className="font-mono text-emerald-400 font-bold">{gpt4oRatio}% of queries</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={gpt4oRatio}
                onChange={(e) => setGpt4oRatio(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>20% (Conservative)</span>
                <span>60% (Typical)</span>
                <span>95% (Aggressive)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 bg-slate-900/80 border border-white/5 space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Calculated Monthly Breakdown</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Single Model (100% GPT-4o Baseline)</span>
                <span className="font-mono font-semibold text-rose-300">${Math.round(baselineCostMonthly).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">ModelMesh AI Orchestrated Spend</span>
                <span className="font-mono font-semibold text-indigo-300">${Math.round(routedCostMonthly).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-base text-emerald-400 pt-1">
                <span>Net Monthly Savings</span>
                <span className="font-mono">${Math.round(monthlySavings).toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-400 leading-relaxed">
              *Calculated using weighted token costs across Claude 3.5 Sonnet, DeepSeek V3, Gemini Flash, and GPT-4o-mini based on real benchmark pricing.
            </div>
          </div>
        </div>
      </section>

      {/* Model Registry Quick Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Supported LLMs in Active Mesh</h3>
            <p className="text-xs text-slate-400">Real-time parameters loaded into the deterministic router</p>
          </div>
          <button
            onClick={() => setActiveTab('registry')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Manage Model Registry <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.slice(0, 4).map((m) => (
            <div key={m.id} className="glass-panel-interactive p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{m.name}</span>
                <span className="badge badge-indigo">{m.provider}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">In: ${m.inputCost}/1M</span>
                <span className="text-emerald-400">Score: {m.qualityScore}/100</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
