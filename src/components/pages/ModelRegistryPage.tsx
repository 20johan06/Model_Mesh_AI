import React, { useState, useMemo } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { Provider, Domain } from '../../types';
import {
  Layers,
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';

export const ModelRegistryPage: React.FC = () => {
  const { models, addModel, toggleModelActive } = useModelMesh();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Model Form State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Provider>('OpenAI');
  const [inputCost, setInputCost] = useState('0.50');
  const [outputCost, setOutputCost] = useState('2.00');
  const [avgLatencyMs, setAvgLatencyMs] = useState('300');
  const [qualityScore, setQualityScore] = useState('90');
  const [contextWindow, setContextWindow] = useState('128000');
  const [description, setDescription] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<Domain[]>(['General']);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchProv = selectedProvider === 'all' || m.provider === selectedProvider;

      return matchSearch && matchProv;
    });
  }, [models, searchTerm, selectedProvider]);

  const handleDomainToggle = (d: Domain) => {
    if (selectedDomains.includes(d)) {
      setSelectedDomains(selectedDomains.filter((item) => item !== d));
    } else {
      setSelectedDomains([...selectedDomains, d]);
    }
  };

  const handleAddModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addModel({
      name,
      provider,
      inputCost: Number(inputCost),
      outputCost: Number(outputCost),
      avgLatencyMs: Number(avgLatencyMs),
      qualityScore: Number(qualityScore),
      contextWindow: Number(contextWindow),
      domains: selectedDomains.length > 0 ? selectedDomains : ['General'],
      active: true,
      status: 'Operational',
      description: description || 'Custom enterprise registered LLM.',
      speedRating: Number(avgLatencyMs) < 200 ? 'Ultra-Fast' : 'Standard'
    });

    setName('');
    setDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Active Model Catalog & Benchmark Specs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Model Registry</h1>
          <p className="text-sm text-slate-400">
            Manage available LLM endpoints, benchmark parameters, token pricing, and SLA latency metrics.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2 px-4 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Register New Model
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search model name or provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'OpenAI', 'Anthropic', 'DeepSeek', 'Google', 'Meta'].map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                selectedProvider === prov
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((m) => (
          <div
            key={m.id}
            className={`glass-panel p-5 space-y-4 border transition ${
              m.active ? 'border-white/10 hover:border-indigo-500/40' : 'border-rose-500/20 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="badge badge-indigo text-[10px] mb-1">{m.provider}</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {m.name}
                  {m.status === 'Operational' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Operational"></span>
                  )}
                </h3>
              </div>

              <button
                onClick={() => toggleModelActive(m.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  m.active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {m.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {m.active ? 'Active' : 'Disabled'}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed min-h-[2.5rem]">
              {m.description}
            </p>

            {/* Domains Pills */}
            <div className="flex flex-wrap gap-1">
              {m.domains.map((dom) => (
                <span key={dom} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5 font-mono">
                  {dom}
                </span>
              ))}
            </div>

            {/* Metrics Matrix */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/80 border border-white/5">
                <div className="text-[10px] text-slate-400">Input Cost</div>
                <div className="font-bold text-slate-200">${m.inputCost}/1M</div>
              </div>

              <div className="p-2 rounded bg-slate-900/80 border border-white/5">
                <div className="text-[10px] text-slate-400">Avg Latency</div>
                <div className="font-bold text-cyan-400">{m.avgLatencyMs}ms</div>
              </div>

              <div className="p-2 rounded bg-slate-900/80 border border-white/5">
                <div className="text-[10px] text-slate-400">Quality</div>
                <div className="font-bold text-indigo-400">{m.qualityScore}/100</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-lg w-full border-indigo-500/40 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Register Custom LLM Model</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddModelSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Llama-3.3-8B-Custom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as Provider)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Google">Google</option>
                    <option value="Meta">Meta</option>
                    <option value="Mistral">Mistral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Input Cost ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputCost}
                    onChange={(e) => setInputCost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Output Cost ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={outputCost}
                    onChange={(e) => setOutputCost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Latency (ms)</label>
                  <input
                    type="number"
                    required
                    value={avgLatencyMs}
                    onChange={(e) => setAvgLatencyMs(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quality Score (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={qualityScore}
                    onChange={(e) => setQualityScore(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Context Window</label>
                  <input
                    type="number"
                    required
                    value={contextWindow}
                    onChange={(e) => setContextWindow(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of capabilities..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Domain Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {(['Code', 'Math', 'Reasoning', 'Creative', 'General', 'Speed'] as Domain[]).map((dom) => {
                    const isSel = selectedDomains.includes(dom);
                    return (
                      <button
                        type="button"
                        key={dom}
                        onClick={() => handleDomainToggle(dom)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          isSel ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {dom}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Add to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
