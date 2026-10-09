import React, { useState } from 'react';
import {
  Network,
  Cpu,
  Code2,
  Sparkles
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<number>(3);
  const [codeLanguage, setCodeLanguage] = useState<'typescript' | 'python'>('typescript');

  const nodes = [
    {
      id: 1,
      title: '1. Ingress Proxy & API Gateway',
      short: 'Edge Proxy',
      desc: 'Handles client payload ingestion, rate limiting, authentication headers, and stream multiplexing.',
      detail: 'The Ingress Gateway accepts standard OpenAI-compatible `/v1/chat/completions` JSON requests. It normalizes headers, verifies JWT API keys, and routes incoming streams into the zero-copy pipeline queue with sub-1ms overhead.',
      tech: ['HTTP/2 Multiplexing', 'Rust Actix-Web', 'gRPC Bridge', 'Zero-Copy Queue']
    },
    {
      id: 2,
      title: '2. Tokenizer & Semantic Classifier',
      short: 'Semantic Classifier',
      desc: 'Extracts syntax markers, estimates token count, calculates complexity score, and detects prompt domain.',
      detail: 'Uses deterministic keyword AST analysis and Byte-Pair Encoding (BPE) token counting to evaluate prompt complexity (1-10 scale). Detects whether prompt requires code synthesis, symbolic math, speed summarization, or creative writing.',
      tech: ['BPE Tokenizer', 'AST Syntax Parser', 'Keyword Scoring', 'Domain Classifier']
    },
    {
      id: 3,
      title: '3. Multi-Criteria Scoring Engine',
      short: 'Optimization Router',
      desc: 'Calculates utility scores across candidate models using weighted multi-attribute formula.',
      detail: 'Evaluates normalized quality scores (35%), domain capability match (30%), endpoint reliability (15%), SLA latency (10%), and token cost (10%). Produces an audit score vector for all models in under 2ms.',
      tech: ['Utility Function', 'Vector Ranking', 'Dynamic Weights', 'Pareto Optimization']
    },
    {
      id: 4,
      title: '4. Hard SLA & Policy Enforcer',
      short: 'SLA Enforcer',
      desc: 'Disqualifies candidates exceeding max latency budgets or minimum quality floors, evaluating custom rules.',
      detail: 'Checks hard constraint boundaries defined by the organization. Evaluates custom IF-THEN rule overrides (e.g. IF domain == Code THEN route to Sonnet) before final model selection.',
      tech: ['SLA Constraint Filter', 'Rule Engine', 'Quality Floor', 'Custom Overrides']
    },
    {
      id: 5,
      title: '5. Provider Failover & Load Balancer',
      short: 'Failover Cascade',
      desc: 'Monitors real-time API health, rate limits, and triggers automatic fallback cascades.',
      detail: 'Maintains active health-check heartbeats to OpenAI, Anthropic, DeepSeek, Google, Meta, and Mistral APIs. If a primary candidate returns 429 rate limit or 5xx server error, the Failover Cascade instantly reroutes traffic.',
      tech: ['Health Monitor', 'Rate Limit Shield', 'Circuit Breaker', 'Fallback Cascade']
    },
    {
      id: 6,
      title: '6. Telemetry & Response Synthesizer',
      short: 'Telemetry Stream',
      desc: 'Streams response tokens to client while recording latency, token usage, and cost savings telemetry.',
      detail: 'Streams response chunks to the client via Server-Sent Events (SSE). Simultaneously pushes telemetry metrics to the analytics log queue to calculate cost savings vs GPT-4o baseline.',
      tech: ['Server-Sent Events', 'Telemetry Collector', 'Cost Calculator', 'Log Exporter']
    }
  ];

  const activeNodeData = nodes.find((n) => n.id === selectedNode) || nodes[2];

  const tsSnippet = `import { ModelMeshClient } from '@modelmesh/ai-sdk';

const client = new ModelMeshClient({
  apiKey: process.env.MODELMESH_API_KEY,
  routingStrategy: 'balanced', // Quality (35%), Capability (30%), Reliability (15%), Latency (10%), Cost (10%)
  maxLatencyBudgetMs: 500
});

// Prompt is deterministically routed to optimal LLM
const response = await client.chat.completions.create({
  prompt: "Refactor this SQL query to use window functions in PostgreSQL.",
  temperature: 0.2
});

console.log(\`Routed to: \${response.meta.selectedModel}\`);
console.log(\`Cost saved: \${response.meta.costSavingsPercent}%\`);`;

  const pySnippet = `from modelmesh import ModelMeshClient

client = ModelMeshClient(
    api_key="mm_live_...",
    routing_strategy="cost",
    minimum_quality=85
)

# Request automatically routes to lowest cost model meeting SLA
response = client.chat.completions.create(
    prompt="Summarize financial earnings transcript.",
    stream=True
)

print(f"Target Model: {response.selected_model}")
print(f"Latency: {response.execution_time_ms}ms")`;

  return (
    <div className="space-y-8 pb-12 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Visual Pipeline Topology & Technical Specs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">System Architecture</h1>
          <p className="text-sm text-slate-400">
            Interactive visual request lifecycle breakdown, mathematical scoring formulas, and SDK integration guides.
          </p>
        </div>
      </div>

      {/* Interactive Topology Diagram Pipeline */}
      <div className="glass-panel p-6 space-y-6 border-indigo-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Interactive End-to-End Request Topology
          </h3>
          <span className="text-xs text-slate-400">Click any component to inspect internal mechanics</span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {nodes.map((node) => {
            const isSel = node.id === selectedNode;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-3.5 rounded-xl border cursor-pointer text-center space-y-2 transition ${
                  isSel
                    ? 'bg-indigo-600/25 border-indigo-500 shadow-lg glow-indigo text-white'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-400'
                }`}
              >
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center mx-auto ${
                  isSel ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {node.id}
                </div>
                <div className="font-bold text-xs truncate">{node.short}</div>
              </div>
            );
          })}
        </div>

        {/* Component Deep Dive Card */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              {activeNodeData.id}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{activeNodeData.title}</h4>
              <p className="text-xs text-indigo-300">{activeNodeData.desc}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {activeNodeData.detail}
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {activeNodeData.tech.map((t) => (
              <span key={t} className="text-[10px] bg-slate-950 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-mono">
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mathematical Utility Formula Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Deterministic Scoring Utility Function
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 leading-relaxed space-y-2">
            <div className="text-slate-400">// Multi-Attribute Optimization Formula</div>
            <div className="text-sm font-bold text-white">
              U(M) = 0.35 \cdot Q(M) + 0.30 \cdot C_m(M) + 0.15 \cdot R(M) + 0.10 \cdot L(M) + 0.10 \cdot C_e(M)
            </div>
            <div className="text-[11px] text-slate-400 pt-2 space-y-1">
              <div>• <strong>Q(M) [35%]</strong>: Model Quality Benchmark score (1-100)</div>
              <div>• <strong>C_m(M) [30%]</strong>: Domain Capability match (100 matched, 70 general)</div>
              <div>• <strong>R(M) [15%]</strong>: Operational Reliability (100 Operational, 40 Degraded)</div>
              <div>• <strong>L(M) [10%]</strong>: Latency Suitability (sub-500ms score)</div>
              <div>• <strong>C_e(M) [10%]</strong>: Token Cost Efficiency vs baseline</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            By evaluating this utility function deterministically for every request, ModelMesh AI guarantees mathematically optimal model selection without random sampling or biased routing.
          </p>
        </div>

        {/* Developer SDK Code Snippet */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              API Gateway Integration SDK
            </h3>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setCodeLanguage('typescript')}
                className={`px-2.5 py-0.5 rounded font-semibold transition ${
                  codeLanguage === 'typescript' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setCodeLanguage('python')}
                className={`px-2.5 py-0.5 rounded font-semibold transition ${
                  codeLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
            {codeLanguage === 'typescript' ? tsSnippet : pySnippet}
          </div>
        </div>
      </div>
    </div>
  );
};
