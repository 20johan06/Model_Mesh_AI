import React, { useState } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { RoutingStrategy, RoutingResult } from '../../types';
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
  RotateCcw
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

  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [streamText, setStreamText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);
  const [streamSimulated, setStreamSimulated] = useState(true);

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

  const handleRunExecution = () => {
    if (!prompt.trim()) return;

    setIsExecuting(true);
    setResult(null);
    setStreamText('');
    setPipelineStep(1);

    // Step 1: Tokenize & Classify (100ms)
    setTimeout(() => {
      setPipelineStep(2);
      // Step 2: Scoring & Constraints (250ms)
      setTimeout(() => {
        setPipelineStep(3);
        // Step 3: Decision Engine (350ms)
        setTimeout(() => {
          setPipelineStep(4);
          const res = executeRouting(prompt);
          setResult(res);
          setIsExecuting(false);

          if (streamSimulated) {
            // Simulated token streaming
            const fullText = res.simulatedResponse;
            let i = 0;
            const interval = setInterval(() => {
              i += Math.min(25, fullText.length - i);
              setStreamText(fullText.slice(0, i));
              if (i >= fullText.length) {
                clearInterval(interval);
              }
            }, 30);
          } else {
            setStreamText(res.simulatedResponse);
          }
        }, 150);
      }, 150);
    }, 150);
  };

  const handleCopyResponse = () => {
    if (!streamText) return;
    navigator.clipboard.writeText(streamText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Interactive AI Router Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">AI Playground</h1>
          <p className="text-sm text-slate-400">
            Test how ModelMesh AI classifies prompts, evaluates multi-attribute criteria, and routes requests to optimal LLMs.
          </p>
        </div>

        {/* Strategy Control Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-slate-900 border border-white/10 p-2 rounded-xl max-w-full">
          <div className="text-xs font-medium text-slate-400 pl-2 shrink-0">Routing Strategy:</div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            {(['balanced', 'cost', 'latency', 'quality', 'custom'] as RoutingStrategy[]).map((st) => (
              <button
                key={st}
                onClick={() => setStrategy(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition ${strategy === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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

            {/* Stream Toggle & Run CTA */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamSimulated}
                  onChange={(e) => setStreamSimulated(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                Simulate Streaming Output
              </label>

              <button
                onClick={handleRunExecution}
                disabled={isExecuting || !prompt.trim()}
                className="btn-primary py-2 px-5 font-bold text-xs"
              >
                {isExecuting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Routing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Execute Route
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
                1. Tokenize & Classify
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 2 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                2. Score Candidates
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 3 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                3. Deterministic Route
              </div>
              <div className={`p-2 rounded-lg border transition ${pipelineStep >= 4 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                4. Stream Output
              </div>
            </div>
          </div>

          {/* Results Card */}
          {result ? (
            <div className="space-y-6 fade-in">
              {/* Decision Header */}
              <div className="glass-panel p-5 space-y-4 border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Selected Target Model:</span>
                        <span className="badge badge-indigo">{result.selectedModel.provider}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{result.selectedModel.name}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-emerald-400 font-mono">
                      Saved {result.savingsPercent}% Cost
                    </div>
                    <div className="text-[11px] text-slate-400">vs GPT-4o Baseline</div>
                  </div>
                </div>

                {/* Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Prompt Domain</div>
                    <div className="font-semibold text-indigo-300">{result.promptAnalysis.detectedDomain}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Tokens (In / Out)</div>
                    <div className="font-mono font-semibold text-white">{result.promptTokens} / {result.completionTokens}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Est. Cost</div>
                    <div className="font-mono font-semibold text-emerald-400">${result.estimatedCost.toFixed(5)}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                    <div className="text-slate-400 text-[11px]">Latency SLA</div>
                    <div className="font-mono font-semibold text-cyan-400">{result.executionTimeMs}ms</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                  <strong>Decision Rationale:</strong> {result.decisionReason}
                </div>
              </div>

              {/* Candidate Scoring Breakdown Table */}
              <div className="glass-panel p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Candidate Models Deterministic Score Matrix
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2 px-3">Model</th>
                        <th className="py-2 px-3">Provider</th>
                        <th className="py-2 px-3">Quality</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3">Cost/1M</th>
                        <th className="py-2 px-3 text-right">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {result.allScores.slice(0, 5).map((sc) => {
                        const isWinner = sc.modelId === result.selectedModel.id;
                        return (
                          <tr key={sc.modelId} className={isWinner ? 'bg-indigo-950/40 text-white font-bold' : 'text-slate-300'}>
                            <td className="py-2.5 px-3 flex items-center gap-1.5">
                              {isWinner && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              <span>{sc.modelName}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{sc.provider}</td>
                            <td className="py-2.5 px-3 text-indigo-300">{sc.qualityScore}/100</td>
                            <td className="py-2.5 px-3 text-cyan-300">{sc.estimatedLatency}ms</td>
                            <td className="py-2.5 px-3 text-emerald-300">${sc.estimatedCost.toFixed(5)}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-white">
                              {sc.totalScore} pts
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Output Box */}
              <div className="glass-panel p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Simulated Output Payload
                  </div>

                  <button
                    onClick={handleCopyResponse}
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
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {streamText || <span className="text-slate-500">Waiting for stream response...</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Route Execution</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Enter your prompt payload on the left and click <strong>Execute Route</strong> to observe real-time model selection, score matrix evaluation, and simulated output.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
