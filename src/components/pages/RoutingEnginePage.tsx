import React, { useState } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { RoutingStrategy } from '../../types';
import {
  Cpu,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const RoutingEnginePage: React.FC = () => {
  const {
    strategy,
    setStrategy,
    weights,
    updateWeights,
    customRules,
    addCustomRule,
    toggleCustomRule,
    deleteCustomRule,
    models,
    fallbackChain,
    setFallbackChain
  } = useModelMesh();

  // Rule Form Modal State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [conditionField, setConditionField] = useState<'domain' | 'token_count' | 'keyword' | 'max_latency_budget'>('domain');
  const [operator, setOperator] = useState<'equals' | 'contains' | 'greater_than' | 'less_than'>('equals');
  const [value, setValue] = useState('Code');
  const [targetModelId, setTargetModelId] = useState(models[0]?.id || 'claude-3-5-sonnet');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    addCustomRule({
      name: ruleName,
      conditionField,
      operator,
      value: conditionField === 'token_count' || conditionField === 'max_latency_budget' ? Number(value) : value,
      targetModelId,
      active: true
    });

    setRuleName('');
    setShowRuleModal(false);
  };

  const handleMoveFallback = (index: number, direction: 'up' | 'down') => {
    const newChain = [...fallbackChain];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newChain.length) return;
    const temp = newChain[index];
    newChain[index] = newChain[targetIdx];
    newChain[targetIdx] = temp;
    setFallbackChain(newChain);
  };

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Deterministic Policy & Rules Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Routing Engine Configuration</h1>
          <p className="text-sm text-slate-400">
            Define multi-criteria weights, SLA latency bounds, rule-based overrides, and failover cascade chains.
          </p>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="btn-primary py-2 px-4 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Custom Rule
        </button>
      </div>

      {/* Section 1: Active Strategy & Multi-Attribute Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Strategy Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Primary Routing Mode
            </h3>

            <div className="space-y-2.5">
              {[
                { id: 'balanced', title: 'Balanced (Smart Routing)', desc: 'Optimizes quality (35%), capability (30%), reliability (15%), latency (10%), cost (10%).' },
                { id: 'cost', title: 'Cost-Optimized', desc: 'Prioritizes lowest token pricing per 1M tokens while maintaining quality floor.' },
                { id: 'latency', title: 'Low Latency SLA', desc: 'Prioritizes ultra-fast execution time (<250ms p99) for streaming APIs.' },
                { id: 'quality', title: 'Maximum Accuracy', desc: 'Routes to top-tier benchmark frontier models regardless of token cost.' },
                { id: 'custom', title: 'Custom Rule Overrides', desc: 'Strictly applies user-defined rule conditionals before standard scoring.' }
              ].map((st) => {
                const isActive = strategy === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setStrategy(st.id as RoutingStrategy)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isActive
                        ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md glow-indigo'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {st.title}
                      </span>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Multi-Criteria Sliders & SLA Bounds (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Algorithm Utility Weight Balance
              </h3>
              <span className="text-xs text-slate-400">Total Weight: 100%</span>
            </div>

            <div className="space-y-5">
              {/* Quality Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Model Quality Weight</span>
                  <span className="font-mono text-indigo-400">{Math.round(weights.qualityWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.qualityWeight}
                  onChange={(e) => updateWeights({ qualityWeight: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Cost Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Cost Minimization Weight</span>
                  <span className="font-mono text-emerald-400">{Math.round(weights.costWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.costWeight}
                  onChange={(e) => updateWeights({ costWeight: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Latency Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Latency Speed Weight</span>
                  <span className="font-mono text-cyan-400">{Math.round(weights.latencyWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.latencyWeight}
                  onChange={(e) => updateWeights({ latencyWeight: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* SLA Hard Constraints */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Hard SLA Constraints & Thresholds
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs text-slate-400 block font-medium">Max Latency Budget (ms)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={weights.maxLatencyMs}
                      onChange={(e) => updateWeights({ maxLatencyMs: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                    <span className="text-xs text-slate-400">ms</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs text-slate-400 block font-medium">Min Quality Floor (1-100)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={weights.minimumQuality}
                      onChange={(e) => updateWeights({ minimumQuality: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                    <span className="text-xs text-slate-400">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Custom Rules Builder Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Custom Routing Rules</h3>
            <p className="text-xs text-slate-400">Deterministic rule conditionals that force route matched payloads</p>
          </div>
          <button
            onClick={() => setShowRuleModal(true)}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Target Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customRules.map((rule) => {
                const targetM = models.find((m) => m.id === rule.targetModelId);
                return (
                  <tr key={rule.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{rule.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-300">
                      IF <span className="text-white">{rule.conditionField}</span> {rule.operator} "{String(rule.value)}"
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {targetM ? targetM.name : rule.targetModelId}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleCustomRule(rule.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          rule.active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rule.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {rule.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteCustomRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Fallback Cascade Chain */}
      <div className="glass-panel p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Fallback Failover Cascade Chain</h3>
          <p className="text-xs text-slate-400">Order of operational models evaluated when primary candidate is degraded or rate-limited</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {fallbackChain.map((modelId, idx) => {
            const m = models.find((mod) => mod.id === modelId);
            return (
              <div key={modelId} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Priority #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveFallback(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveFallback(idx, 'down')}
                      disabled={idx === fallbackChain.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="font-bold text-sm text-white">{m ? m.name : modelId}</div>
                <div className="text-[11px] text-slate-400 font-mono">{m?.provider} • Latency: {m?.avgLatencyMs}ms</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-md w-full border-indigo-500/40 space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Create Custom Routing Rule</h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Refactoring Priority"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Condition Field</label>
                <select
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                >
                  <option value="domain">Prompt Domain</option>
                  <option value="token_count">Token Count</option>
                  <option value="keyword">Contains Keyword</option>
                  <option value="max_latency_budget">Max Latency Budget</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Operator</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Value</label>
                  <input
                    type="text"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Route Model</label>
                <select
                  value={targetModelId}
                  onChange={(e) => setTargetModelId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="btn-secondary py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
