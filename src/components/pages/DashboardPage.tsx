import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { RoutingResult } from '../../types';
import {
  BarChart3,
  Activity,
  DollarSign,
  Clock,
  Search,
  Trash2,
  Download,
  Eye,
  X,
  TrendingUp,
  FileText
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { requestLogs, globalMetrics, clearLogs } = useModelMesh();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedLogModal, setSelectedLogModal] = useState<RoutingResult | null>(null);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (selectedLogModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedLogModal]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return requestLogs.filter((log) => {
      const matchSearch =
        log.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.selectedModel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.selectedModel.provider.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDomain = selectedDomain === 'all' || log.promptAnalysis.detectedDomain === selectedDomain;

      return matchSearch && matchDomain;
    });
  }, [requestLogs, searchTerm, selectedDomain]);

  // Model Selection Share Distribution data
  const modelShareData = useMemo(() => {
    const counts: Record<string, { name: string; count: number; provider: string }> = {};
    requestLogs.forEach((log) => {
      const id = log.selectedModel.id;
      if (!counts[id]) {
        counts[id] = { name: log.selectedModel.name, count: 0, provider: log.selectedModel.provider };
      }
      counts[id].count += 1;
    });

    const total = requestLogs.length || 1;
    return Object.values(counts).map((item) => ({
      ...item,
      percentage: Math.round((item.count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [requestLogs]);

  // Export JSON logs function
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(requestLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `modelmesh-analytics-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Routing Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Real-time aggregate telemetry, cost savings metrics, latency distribution, and audit request logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportLogs}
            className="btn-secondary text-xs py-2.5 px-3.5 font-semibold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={clearLogs}
            className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-xl transition shadow-sm"
            title="Clear request history logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Queries Routed</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {globalMetrics.totalRequests}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            100% Deterministically routed
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Token Cost Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            ${globalMetrics.totalCostSaved.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            vs Baseline GPT-4o spend
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Average SLA Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono">
            {globalMetrics.avgLatency} ms
          </div>
          <div className="text-[11px] text-slate-400">
            Across active mesh models
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Tokens Processed</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-mono">
            {globalMetrics.totalTokensProcessed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Prompt & Completion tokens
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Model Selection Frequency Distribution (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Model Selection Distribution
          </h3>

          <div className="space-y-3">
            {modelShareData.map((item) => (
              <div key={item.name} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">{item.name} <span className="text-slate-400 font-normal">({item.provider})</span></span>
                  <span className="font-mono text-indigo-400">{item.percentage}% ({item.count} req)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Timeline & Latency Benchmark Visual Chart (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Request Execution Timeline & Latency
            </h3>
            <span className="text-xs text-slate-400 font-mono">Sub-500ms p99 SLA</span>
          </div>

          {/* Custom Responsive SVG Chart */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-white/10">
            {requestLogs.slice(0, 10).reverse().map((log) => {
              const maxLat = 1000;
              const barHeightPct = Math.min(100, Math.max(15, (log.executionTimeMs / maxLat) * 100));
              return (
                <div key={log.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 w-44 p-2 rounded-lg bg-slate-900 border border-indigo-500/40 text-[10px] text-slate-200 shadow-xl pointer-events-none">
                    <div className="font-bold text-indigo-300">{log.selectedModel.name}</div>
                    <div>Latency: {log.executionTimeMs}ms</div>
                    <div>Savings: {log.savingsPercent}%</div>
                  </div>

                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-md hover:brightness-125 transition-all cursor-pointer"
                    style={{ height: `${barHeightPct}%` }}
                  ></div>

                  <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                    #{log.id.slice(-3)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>← Older Queries</span>
            <span>Recent Queries →</span>
          </div>
        </div>
      </div>

      {/* Filterable Request History Audit Log Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Request Routing History Log</h3>
            <p className="text-xs text-slate-400">Auditable trace of every query payload, model decision, token cost, and SLA timestamp</p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search prompt or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Domains</option>
              <option value="Code">Code</option>
              <option value="Math">Math</option>
              <option value="Reasoning">Reasoning</option>
              <option value="Creative">Creative</option>
              <option value="Speed">Speed</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Req ID</th>
                <th className="py-3 px-4">Prompt Preview</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Routed Model</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Cost Savings</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 text-indigo-400 font-bold">{log.id}</td>
                    <td className="py-3 px-4 max-w-xs font-sans text-slate-200 truncate">
                      {log.prompt}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-indigo">{log.promptAnalysis.detectedDomain}</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {log.selectedModel.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize font-sans">{log.strategy}</td>
                    <td className="py-3 px-4 text-cyan-300">{log.executionTimeMs}ms</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      ${log.costSavings.toFixed(4)} ({log.savingsPercent}%)
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLogModal(log)}
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No matching request logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal via Portal */}
      {selectedLogModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md fade-in"
            onClick={() => setSelectedLogModal(null)}
          >
            <div
              className="glass-panel w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col border-indigo-500/40 shadow-2xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-slate-900/60">
                <div>
                  <span className="text-xs text-indigo-400 font-mono font-bold">{selectedLogModal.id}</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Request Routing Detail</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogModal(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1 custom-scrollbar">
                <div>
                  <label className="text-slate-400 font-bold uppercase block mb-1">Full Prompt Payload</label>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                    {selectedLogModal.prompt}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Routed Model</div>
                    <div className="font-bold text-white">{selectedLogModal.selectedModel.name}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Tokens (In/Out)</div>
                    <div className="font-bold text-white">{selectedLogModal.promptTokens} / {selectedLogModal.completionTokens}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Execution Latency</div>
                    <div className="font-bold text-cyan-400">{selectedLogModal.executionTimeMs}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Cost Savings</div>
                    <div className="font-bold text-emerald-400">${selectedLogModal.costSavings.toFixed(5)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase block mb-1">Decision Reasoning</label>
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 leading-relaxed">
                    {selectedLogModal.decisionReason}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
