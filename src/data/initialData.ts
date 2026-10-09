import type { Model, CustomRule, RoutingWeights, RoutingResult } from '../types';

export const INITIAL_MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputCost: 2.50, // per 1M tokens
    outputCost: 10.00, // per 1M tokens
    avgLatencyMs: 420,
    qualityScore: 96,
    contextWindow: 128000,
    domains: ['General', 'Reasoning', 'Code', 'Creative'],
    active: true,
    status: 'Operational',
    description: 'Flagship multimodal high-intelligence model for complex multi-step reasoning.',
    speedRating: 'Standard'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    inputCost: 0.15,
    outputCost: 0.60,
    avgLatencyMs: 190,
    qualityScore: 84,
    contextWindow: 128000,
    domains: ['Speed', 'General', 'Creative'],
    active: true,
    status: 'Operational',
    description: 'Ultra-fast lightweight model ideal for high-volume summarization & simple QA.',
    speedRating: 'Ultra-Fast'
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    inputCost: 1.10,
    outputCost: 4.40,
    avgLatencyMs: 850,
    qualityScore: 97,
    contextWindow: 200000,
    domains: ['Math', 'Reasoning', 'Code'],
    active: true,
    status: 'Operational',
    description: 'Advanced STEM & coding reasoning model designed for complex logic chains.',
    speedRating: 'Deep Reasoning'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCost: 3.00,
    outputCost: 15.00,
    avgLatencyMs: 460,
    qualityScore: 98,
    contextWindow: 200000,
    domains: ['Code', 'Reasoning', 'Creative', 'General'],
    active: true,
    status: 'Operational',
    description: 'Industry benchmark for software engineering, deep analysis, and nuanced writing.',
    speedRating: 'Standard'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    inputCost: 0.80,
    outputCost: 4.00,
    avgLatencyMs: 210,
    qualityScore: 88,
    contextWindow: 200000,
    domains: ['Speed', 'Code', 'General'],
    active: true,
    status: 'Operational',
    description: 'Near Sonnet quality code completion with lightning latency.',
    speedRating: 'Fast'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    inputCost: 0.55,
    outputCost: 2.19,
    avgLatencyMs: 780,
    qualityScore: 96,
    contextWindow: 64000,
    domains: ['Math', 'Reasoning', 'Code'],
    active: true,
    status: 'Operational',
    description: 'Open-weights reasoning powerhouse with unprecedented cost efficiency.',
    speedRating: 'Deep Reasoning'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    inputCost: 0.14,
    outputCost: 0.28,
    avgLatencyMs: 240,
    qualityScore: 93,
    contextWindow: 64000,
    domains: ['Code', 'General', 'Speed', 'Math'],
    active: true,
    status: 'Operational',
    description: 'Extreme throughput MoE model offering frontier-grade performance at sub-cent cost.',
    speedRating: 'Fast'
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    inputCost: 1.25,
    outputCost: 5.00,
    avgLatencyMs: 390,
    qualityScore: 94,
    contextWindow: 2000000,
    domains: ['General', 'Reasoning', 'Creative'],
    active: true,
    status: 'Operational',
    description: '2M token context window specialized for document ingestion & long narrative.',
    speedRating: 'Standard'
  },
  {
    id: 'gemini-1-5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    inputCost: 0.075,
    outputCost: 0.30,
    avgLatencyMs: 160,
    qualityScore: 85,
    contextWindow: 1000000,
    domains: ['Speed', 'General'],
    active: true,
    status: 'Operational',
    description: 'Sub-200ms latency workhorse built for extreme scale API microservices.',
    speedRating: 'Ultra-Fast'
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    inputCost: 0.35,
    outputCost: 0.70,
    avgLatencyMs: 280,
    qualityScore: 91,
    contextWindow: 128000,
    domains: ['General', 'Creative', 'Code'],
    active: true,
    status: 'Operational',
    description: 'State-of-the-art open source model with versatile reasoning capabilities.',
    speedRating: 'Fast'
  }
];

export const DEFAULT_WEIGHTS: RoutingWeights = {
  costWeight: 0.10,
  latencyWeight: 0.10,
  qualityWeight: 0.35,
  maxLatencyMs: 1000,
  maxCostPer1k: 0.01,
  minimumQuality: 80
};

export const INITIAL_CUSTOM_RULES: CustomRule[] = [
  {
    id: 'rule-1',
    name: 'High-Complexity Coding Rule',
    conditionField: 'domain',
    operator: 'equals',
    value: 'Code',
    targetModelId: 'claude-3-5-sonnet',
    active: true
  },
  {
    id: 'rule-2',
    name: 'Math & Symbolic Logic',
    conditionField: 'domain',
    operator: 'equals',
    value: 'Math',
    targetModelId: 'deepseek-r1',
    active: true
  },
  {
    id: 'rule-3',
    name: 'Low Latency Ultra-Fast API',
    conditionField: 'max_latency_budget',
    operator: 'less_than',
    value: 200,
    targetModelId: 'gemini-1-5-flash',
    active: true
  }
];

export const INITIAL_FALLBACK_CHAIN = [
  'claude-3-5-sonnet',
  'gpt-4o',
  'deepseek-v3',
  'gpt-4o-mini'
];

export const INITIAL_HISTORICAL_LOGS: RoutingResult[] = [
  {
    id: 'req-101',
    prompt: 'Write a Rust async function using Tokio to query a PostgreSQL database connection pool with retries.',
    strategy: 'balanced',
    selectedModel: INITIAL_MODELS.find(m => m.id === 'claude-3-5-sonnet')!,
    promptAnalysis: {
      tokenCount: 42,
      complexityScore: 8,
      detectedDomain: 'Code',
      requiresCode: true,
      requiresReasoning: true,
      requiresSpeed: false,
      keywords: ['rust', 'async', 'tokio', 'postgresql', 'pool', 'retries']
    },
    allScores: [],
    decisionReason: 'Evaluated multi-criteria utility weights [Quality: 35%, Capability: 30%, Reliability: 15%, Latency: 10%, Cost: 10%]. Claude 3.5 Sonnet scored highest (96.5 pts).',
    executionTimeMs: 440,
    promptTokens: 42,
    completionTokens: 380,
    estimatedCost: 0.0058,
    baselineCost: 0.0089,
    costSavings: 0.0031,
    savingsPercent: 34.8,
    simulatedResponse: '```rust\nuse tokio_postgres::{NoTls, Client};\n// Implementation details...\n```',
    fallbackTriggered: false,
    fallbackChain: INITIAL_FALLBACK_CHAIN,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'req-102',
    prompt: 'Summarize the top 5 key takeaways from this financial earnings call transcript.',
    strategy: 'cost',
    selectedModel: INITIAL_MODELS.find(m => m.id === 'deepseek-v3')!,
    promptAnalysis: {
      tokenCount: 1540,
      complexityScore: 4,
      detectedDomain: 'General',
      requiresCode: false,
      requiresReasoning: false,
      requiresSpeed: true,
      keywords: ['summarize', 'financial', 'earnings', 'transcript']
    },
    allScores: [],
    decisionReason: 'Cost-Optimized strategy selected DeepSeek V3 ($0.14/1M input vs $2.50 GPT-4o).',
    executionTimeMs: 230,
    promptTokens: 1540,
    completionTokens: 220,
    estimatedCost: 0.00027,
    baselineCost: 0.00605,
    costSavings: 0.00578,
    savingsPercent: 95.5,
    simulatedResponse: '1. Revenue grew 24% YoY.\n2. Operating margin expanded to 31%...\n',
    fallbackTriggered: false,
    fallbackChain: INITIAL_FALLBACK_CHAIN,
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString()
  }
];
