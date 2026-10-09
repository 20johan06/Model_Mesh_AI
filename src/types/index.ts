export type Provider = 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Google' | 'Meta' | 'Mistral';

export type Domain = 'Code' | 'Math' | 'Reasoning' | 'Creative' | 'General' | 'Speed';

export interface Model {
  id: string;
  name: string;
  provider: Provider;
  inputCost: number; // USD per 1M input tokens
  outputCost: number; // USD per 1M output tokens
  avgLatencyMs: number;
  qualityScore: number; // 1 - 100
  contextWindow: number; // in tokens
  domains: Domain[];
  active: boolean;
  status: 'Operational' | 'Degraded' | 'Offline';
  description: string;
  speedRating: 'Ultra-Fast' | 'Fast' | 'Standard' | 'Deep Reasoning';
}

export type RoutingStrategy = 'cost' | 'latency' | 'quality' | 'balanced' | 'custom' | 'fallback';

export interface RoutingWeights {
  costWeight: number; // 0 to 1
  latencyWeight: number; // 0 to 1
  qualityWeight: number; // 0 to 1
  maxLatencyMs: number; // Maximum allowed latency
  maxCostPer1k: number; // Max cost threshold in USD
  minimumQuality: number; // Minimum acceptable quality score (1-100)
}

export interface CustomRule {
  id: string;
  name: string;
  conditionField: 'domain' | 'token_count' | 'keyword' | 'max_latency_budget';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  targetModelId: string;
  active: boolean;
}

export interface PromptAnalysis {
  tokenCount: number;
  complexityScore: number; // 1 to 10 scale
  detectedDomain: Domain;
  requiresCode: boolean;
  requiresReasoning: boolean;
  requiresSpeed: boolean;
  keywords: string[];
}

export interface ModelScore {
  modelId: string;
  modelName: string;
  provider: Provider;
  totalScore: number;
  costScore: number;
  latencyScore: number;
  qualityScore: number;
  domainMatchScore: number;
  estimatedCost: number;
  estimatedLatency: number;
  disqualified: boolean;
  disqualifyReason?: string;
}

export interface RoutingResult {
  id: string;
  prompt: string;
  strategy: RoutingStrategy;
  selectedModel: Model;
  promptAnalysis: PromptAnalysis;
  allScores: ModelScore[];
  decisionReason: string;
  executionTimeMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  baselineCost: number; // GPT-4o baseline
  costSavings: number;
  savingsPercent: number;
  simulatedResponse: string;
  fallbackTriggered: boolean;
  fallbackChain: string[];
  timestamp: string;
}

export interface GlobalMetrics {
  totalRequests: number;
  totalCostSaved: number;
  avgLatency: number;
  accuracySLA: number;
  totalTokensProcessed: number;
}
