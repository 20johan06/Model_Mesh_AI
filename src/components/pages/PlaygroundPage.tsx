import React, { useState } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { RoutingStrategy, RoutingResult } from '../../types';
import { executeTaskApi, type ExecuteTaskResponse } from '../../services/api';
import {
  Terminal,
  Play,
  Zap,
  Cpu,
  Copy,
  Check,
  Code,
  Calculator,
  Brain,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const PlaygroundPage: React.FC = () => {
  const {
    strategy,
    setStrategy,
    executeRouting,
    weights,
    updateWeights
  } = useModelMesh();

  const [prompt, setPrompt] = useState(
    'Write a Rust async function using Tokio to query a PostgreSQL database connection pool with automatic retries and exponential backoff.'
  );

  const [executionMode, setExecutionMode] = useState<'live' | 'simulation'>('live');
  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  
  // Offline simulation state
  const [simulationResult, setSimulationResult] = useState<RoutingResult | null>(null);
  const [streamText, setStreamText] = useState<string>('');
  
  // Live backend execution state
  const [liveResponse, setLiveResponse] = useState<ExecuteTaskResponse | null>(null);
  const [executionError, setExecutionError] = useState<{ title: string; message: string; type: string } | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);

  // Sample prompt presets
  const presets = [
    {
      label: 'Rust Async Pool',
      icon: <Code className="w-3.5 h-3.5 text-indigo-400" />,
      text: 'Write a Rust async function using Tokio to query a PostgreSQL database connection pool with automatic retries and exponential backoff.'
    },
    {
      label: 'Real Analysis Proof',
      icon: <Calculator className="w-3.5 h-3.5 text-purple-400" />,
      text: 'Prove the convergence of the sequence a_n = (1 + 1/n)^n using real analysis limit theorems and show that e is strictly bounded by 3.'
    },
    {
      label: 'Low Latency Translate',
      icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
      text: 'Translate this user feedback payload to French, German, and Spanish instantly for real-time notification dispatch.'
    },
    {
      label: 'Executive Trade-Off',
      icon: <Brain className="w-3.5 h-3.5 text-amber-400" />,
      text: 'Evaluate the architectural pros and cons of event-driven Kafka stream processing vs REST microservices for high-frequency order matching.'
    }
  ];

  const handleRunExecution = async () => {
    if (!prompt.trim()) return;

    setIsExecuting(true);
    setSimulationResult(null);
    setLiveResponse(null);
    setExecutionError(null);
    setStreamText('');
    setPipelineStep(1);

    if (executionMode === 'live') {
      // Live Backend Execution Pipeline
      setPipelineStep(2);
      try {
        setPipelineStep(3);
        const res = await executeTaskApi({
          query: prompt,
          strategy: strategy as any
        });
        setPipelineStep(4);
        setIsExecuting(false);

        if (res.status === 'success') {
          setLiveResponse(res);
        } else if (res.status === 'auth_error') {
          setExecutionError({
            type: 'auth_error',
            title: 'Hugging Face API Authentication Required (401)',
            message: res.message || 'HF_API_TOKEN is missing or invalid in backend/.env. Please configure a valid Hugging Face API access token.'
          });
        } else if (res.status === 'quota_error') {
          setExecutionError({
            type: 'quota_error',
            title: 'Inference Token Quota Exceeded (402)',
            message: res.message || 'Hugging Face API token inference credit quota exceeded. Purchase pre-paid credits or subscribe to PRO to continue.'
          });
        } else if (res.status === 'no_compatible_model') {
          setExecutionError({
            type: 'no_compatible_model',
            title: 'No Compatible Model Endpoint (422)',
            message: res.message || 'No Hugging Face model endpoints available for this task type.'
          });
        } else {
          setExecutionError({
            type: 'provider_execution_error',
            title: 'LLM Provider Execution Error (503)',
            message: res.message || res.lastError || 'LLM provider execution failed across all candidate endpoints.'
          });
        }
      } catch (err: any) {
        setIsExecuting(false);
        setExecutionError({
          type: 'network_error',
          title: 'Backend Connection Failure',
          message: err.message || 'Could not connect to backend server at http://localhost:3001.'
        });
      }

    } else {
      // Simulation Mode (Offline Demo)
      setTimeout(() => {
        setPipelineStep(2);
        setTimeout(() => {
          setPipelineStep(3);
          setTimeout(() => {
            setPipelineStep(4);
            const res = executeRouting(prompt);
            setSimulationResult(res);
            setIsExecuting(false);

            const fullText = res.simulatedResponse;
            let i = 0;
            const interval = setInterval(() => {
              i += Math.min(25, fullText.length - i);
              setStreamText(fullText.slice(0, i));
              if (i >= fullText.length) {
                clearInterval(interval);
              }
            }, 30);
          }, 150);
        }, 150);
      }, 150);
    }
  };

  const handleCopyResponse = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Interactive Multi-LLM Execution Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">AI Playground</h1>
          <p className="text-sm text-slate-400">
            Execute tasks through ModelMesh AI context understanding, deterministic routing, and real provider inference.
          </p>
        </div>

        {/* Execution Mode & Strategy Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Execution Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-xl">
            <button
              onClick={() => setExecutionMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                executionMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${executionMode === 'live' ? 'animate-pulse' : ''}`} />
              Live Backend (Real LLM)
            </button>
            <button
              onClick={() => setExecutionMode('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                executionMode === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Offline Demo (Simulation)
            </button>
          </div>

          {/* Strategy Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 p-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-medium px-2">Strategy:</span>
            {(['balanced', 'cost', 'latency', 'quality'] as RoutingStrategy[]).map((st) => (
              <button
                key={st}
                onClick={() => setStrategy(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  strategy === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Playground Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input & Control Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Prompt Payload Input
              </label>

              <button
                onClick={() => setPrompt('')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste any query (code, math proof, summarization, fast translate)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans"
            />

            {/* Presets Picker */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-2">Sample Template Presets:</div>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(p.text)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-xs text-slate-300 text-left transition"
                  >
                    {p.icon}
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Trigger */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Privacy Redaction Active</span>
              </div>

              <button
                onClick={handleRunExecution}
                disabled={isExecuting || !prompt.trim()}
                className={`py-2 px-5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition ${
                  executionMode === 'live'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                }`}
              >
                {isExecuting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {executionMode === 'live' ? 'Run Real Inference' : 'Simulate Route'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Strategy Weights Fine-Tuner Accordion */}
          <div className="glass-panel p-4 space-y-3">
            <button
              onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Strategy Weight Parameters</span>
              </div>
              {showAdvancedWeights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedWeights && (
              <div className="space-y-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Quality Weight</span>
                    <span className="font-mono text-indigo-400 font-bold">{Math.round(weights.qualityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.qualityWeight}
                    onChange={(e) => updateWeights({ qualityWeight: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Cost Savings Weight</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(weights.costWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.costWeight}
                    onChange={(e) => updateWeights({ costWeight: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Low Latency Weight</span>
                    <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.latencyWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.latencyWeight}
                    onChange={(e) => updateWeights({ latencyWeight: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Output & Decision Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Step Tracker Pipeline */}
          <div className="glass-panel p-4 bg-slate-900/60 border-white/5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Execution Lifecycle Pipeline
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 1 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                1. Context & Privacy
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 2 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                2. Score Candidates
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 3 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                3. Deterministic Route
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 4 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                4. LLM Execution
              </div>
            </div>
          </div>

          {/* Actionable Error Display */}
          {executionError && (
            <div className="glass-panel p-5 border-amber-500/40 bg-amber-950/20 space-y-3 fade-in">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{executionError.title}</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-amber-900/50">
                {executionError.message}
              </p>
            </div>
          )}

          {/* Live Backend Results Display */}
          {liveResponse && liveResponse.execution ? (
            <div className="space-y-6 fade-in">
              {/* Decision Header */}
              <div className={`glass-panel p-5 space-y-4 ${
                liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                  ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900'
                  : 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400'
                        : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
                    }`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          {liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                            ? 'Target Candidate (Simulated Fallback):'
                            : 'Winning LLM Provider:'}
                        </span>
                        <span className={`badge ${
                          liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'badge-emerald'
                        }`}>{liveResponse.execution.provider}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{liveResponse.execution.modelId}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    {liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback' ? (
                      <span className="badge bg-slate-800 text-slate-300 border border-slate-700 font-bold px-3 py-1">
                        SIMULATED RESPONSE — Provider unavailable
                      </span>
                    ) : (
                      <span className="badge badge-emerald">Live Real Inference</span>
                    )}
                  </div>
                </div>

                {/* Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Detected Task</div>
                    <div className="font-semibold text-indigo-300 capitalize">{liveResponse.queryAnalysis?.taskType || 'general'}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">
                      {liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                        ? 'Estimated Latency (Fallback)'
                        : 'Real Measured Latency'}
                    </div>
                    <div className="font-mono font-semibold flex items-center gap-1 text-cyan-400">
                      <Clock className="w-3 h-3" />
                      {liveResponse.execution.realLatencyMs}ms
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Execution Path</div>
                    <div className="font-mono font-semibold text-white">
                      {liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                        ? 'Static Model Fallback'
                        : liveResponse.routing?.fallbackUsed
                        ? 'Live Candidate Fallback'
                        : 'Live Top Candidate'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Privacy Redactions</div>
                    <div className="font-mono font-semibold text-emerald-400">
                      {liveResponse.privacy?.redactionCount || 0} items
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Response Output */}
              <div className="glass-panel p-5 space-y-3">
                {(liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback') && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-300 text-xs font-bold shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>SIMULATED RESPONSE — Provider unavailable</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {liveResponse.execution.isSimulated || liveResponse.execution.sourceType === 'static_fallback'
                      ? 'Simulated Fallback Output Payload'
                      : 'Real LLM Output Payload'}
                  </div>

                  {liveResponse.execution.output && (
                    <button
                      onClick={() => handleCopyResponse(liveResponse.execution?.output || '')}
                      className="text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Code
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {liveResponse.execution.output || <span className="text-slate-500">No text output returned.</span>}
                </div>
              </div>
            </div>
          ) : simulationResult ? (
            /* Simulation Results Display */
            <div className="space-y-6 fade-in">
              <div className="glass-panel p-5 space-y-4 border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Target Model:</span>
                        <span className="badge badge-indigo">{simulationResult.selectedModel.provider}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{simulationResult.selectedModel.name}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="badge bg-slate-800 text-slate-300 border border-slate-700">Offline Demo Simulation</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {streamText || <span className="text-slate-500">Waiting for stream response...</span>}
                </div>
              </div>
            </div>
          ) : !executionError ? (
            <div className="glass-panel p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Multi-LLM Execution</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select <strong>Live Backend</strong> mode to execute prompts through real model provider APIs with privacy redaction and real latency measurement.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
