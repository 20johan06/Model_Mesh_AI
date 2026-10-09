import type {
  Model,
  RoutingStrategy,
  RoutingWeights,
  CustomRule,
  PromptAnalysis,
  ModelScore,
  RoutingResult,
  Domain
} from '../types';

/**
 * Analyzes prompt text deterministically for token count, complexity score, and domain classification.
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Estimate tokens (~1.35 tokens per word)
  const tokenCount = Math.max(1, Math.ceil(wordCount * 1.35));

  const lower = prompt.toLowerCase();

  // Keyword sets
  const codeKeywords = [
    'code', 'function', 'class', 'import', 'rust', 'python', 'javascript', 'typescript',
    'sql', 'react', 'api', 'bug', 'refactor', 'docker', 'algorithm', 'component', 'html',
    'css', 'async', 'await', 'git', 'endpoint', 'json', 'interface', 'struct'
  ];

  const mathKeywords = [
    'math', 'prove', 'theorem', 'equation', 'derivative', 'integral', 'matrix',
    'calculus', 'algebra', 'probability', 'formula', 'vector', 'sequence', 'convergence', 'proof'
  ];

  const reasoningKeywords = [
    'why', 'explain', 'analyze', 'evaluate', 'compare', 'contrast', 'architecture',
    'trade-off', 'strategy', 'impact', 'philosophy', 'cause', 'implication', 'pros and cons'
  ];

  const speedKeywords = [
    'translate', 'summarize', 'extract', 'format', 'convert', 'quick', 'brief',
    'list', 'classify', 'sentiment', 'parse'
  ];

  const creativeKeywords = [
    'write', 'story', 'poem', 'essay', 'creative', 'brainstorm', 'slogan', 'headline',
    'marketing', 'dialogue', 'fiction', 'scenario'
  ];

  const codeMatches = codeKeywords.filter(k => lower.includes(k));
  const mathMatches = mathKeywords.filter(k => lower.includes(k));
  const reasoningMatches = reasoningKeywords.filter(k => lower.includes(k));
  const speedMatches = speedKeywords.filter(k => lower.includes(k));
  const creativeMatches = creativeKeywords.filter(k => lower.includes(k));

  const requiresCode = codeMatches.length > 0;
  const requiresReasoning = mathMatches.length > 0 || reasoningMatches.length > 0;
  const requiresSpeed = speedMatches.length > 0 && wordCount < 40;

  // Domain determination
  let detectedDomain: Domain = 'General';
  if (codeMatches.length >= Math.max(mathMatches.length, reasoningMatches.length, creativeMatches.length, speedMatches.length) && codeMatches.length > 0) {
    detectedDomain = 'Code';
  } else if (mathMatches.length > 0) {
    detectedDomain = 'Math';
  } else if (reasoningMatches.length > 0) {
    detectedDomain = 'Reasoning';
  } else if (creativeMatches.length > 0) {
    detectedDomain = 'Creative';
  } else if (requiresSpeed) {
    detectedDomain = 'Speed';
  }

  // Calculate complexity score (1 to 10 scale)
  let complexityScore = 3;
  if (wordCount > 60) complexityScore += 2;
  if (wordCount > 180) complexityScore += 2;
  if (requiresCode) complexityScore += 2;
  if (mathMatches.length > 0) complexityScore += 2;
  if (reasoningMatches.length > 0) complexityScore += 1;
  complexityScore = Math.min(10, Math.max(1, complexityScore));

  const keywords = Array.from(new Set([
    ...codeMatches,
    ...mathMatches,
    ...reasoningMatches,
    ...speedMatches,
    ...creativeMatches
  ])).slice(0, 6);

  return {
    tokenCount,
    complexityScore,
    detectedDomain,
    requiresCode,
    requiresReasoning,
    requiresSpeed,
    keywords
  };
}

/**
 * Deterministic multi-criteria model routing engine.
 * Scoring Weights: Quality (35%), Capability Match (30%), Reliability (15%), Latency (10%), Cost (10%).
 */
export function routePrompt(
  prompt: string,
  models: Model[],
  strategy: RoutingStrategy,
  weights: RoutingWeights,
  customRules: CustomRule[],
  fallbackChain: string[]
): RoutingResult {
  const promptAnalysis = analyzePrompt(prompt);
  const promptTokens = promptAnalysis.tokenCount;

  // Estimated completion tokens based on complexity & prompt length
  const completionTokens = Math.max(80, promptAnalysis.complexityScore * 45 + promptTokens * 2);

  // Filter models: Exclude inactive or offline models
  const eligibleModels = models.filter(m => m.active && m.status !== 'Offline');
  // If no eligible active model exists, fall back to all models marked degraded
  const availableModels = eligibleModels.length > 0 ? eligibleModels : models;

  // Check Custom Rules if strategy === 'custom' or if an active rule matches
  let matchedRule: CustomRule | undefined;
  if (strategy === 'custom' || customRules.some(r => r.active)) {
    matchedRule = customRules.find(rule => {
      if (!rule.active) return false;
      if (rule.conditionField === 'domain') {
        return rule.operator === 'equals' && promptAnalysis.detectedDomain === rule.value;
      }
      if (rule.conditionField === 'token_count') {
        const val = Number(rule.value);
        if (rule.operator === 'greater_than') return promptTokens > val;
        if (rule.operator === 'less_than') return promptTokens < val;
        if (rule.operator === 'equals') return promptTokens === val;
      }
      if (rule.conditionField === 'keyword') {
        return prompt.toLowerCase().includes(String(rule.value).toLowerCase());
      }
      if (rule.conditionField === 'max_latency_budget') {
        const budget = Number(rule.value);
        return weights.maxLatencyMs <= budget;
      }
      return false;
    });
  }

  // Score candidate models deterministically
  const scores: ModelScore[] = availableModels.map(model => {
    // 1. Costs
    const inputCost = (promptTokens * model.inputCost) / 1000000;
    const outputCost = (completionTokens * model.outputCost) / 1000000;
    const estimatedCost = inputCost + outputCost;
    const estimatedLatency = Math.round(model.avgLatencyMs * (0.9 + (promptTokens / 1000) * 0.1));

    // Hard constraints check
    let disqualified = false;
    let disqualifyReason: string | undefined;

    if (!model.active) {
      disqualified = true;
      disqualifyReason = 'Model is disabled in registry.';
    } else if (model.status === 'Offline') {
      disqualified = true;
      disqualifyReason = 'Model endpoint is offline.';
    } else if (strategy === 'latency' && model.avgLatencyMs > weights.maxLatencyMs * 1.5) {
      disqualified = true;
      disqualifyReason = `Latency (${model.avgLatencyMs}ms) exceeds SLA budget (${weights.maxLatencyMs}ms).`;
    } else if (model.qualityScore < weights.minimumQuality && strategy === 'quality') {
      disqualified = true;
      disqualifyReason = `Quality rating (${model.qualityScore}) below required floor (${weights.minimumQuality}).`;
    }

    // Normalized metric components (0 - 100 scale)
    // Quality (35%)
    const qualityScoreNorm = model.qualityScore;

    // Capability Match (30%)
    let capabilityMatchNorm = 50;
    if (model.domains.includes(promptAnalysis.detectedDomain)) {
      capabilityMatchNorm = 100;
    } else if (model.domains.includes('General')) {
      capabilityMatchNorm = 70;
    }

    // Reliability (15%)
    let reliabilityNorm = 100;
    if (model.status === 'Degraded') reliabilityNorm = 40;
    if (model.status === 'Offline') reliabilityNorm = 0;

    // Latency Suitability (10%)
    const latencyScoreNorm = Math.max(0, 100 - (estimatedLatency / 10));

    // Cost Efficiency (10%)
    const costScoreNorm = Math.max(0, 100 - (estimatedCost * 25000));

    let totalScore = 0;

    if (matchedRule && model.id === matchedRule.targetModelId) {
      totalScore = 999; // Rule forced match
    } else {
      switch (strategy) {
        case 'cost':
          totalScore = (costScoreNorm * 0.55) + (capabilityMatchNorm * 0.25) + (qualityScoreNorm * 0.10) + (reliabilityNorm * 0.10);
          break;
        case 'latency':
          totalScore = (latencyScoreNorm * 0.55) + (capabilityMatchNorm * 0.25) + (qualityScoreNorm * 0.10) + (reliabilityNorm * 0.10);
          break;
        case 'quality':
          totalScore = (qualityScoreNorm * 0.50) + (capabilityMatchNorm * 0.30) + (reliabilityNorm * 0.15) + (latencyScoreNorm * 0.05);
          break;
        case 'balanced':
        case 'custom':
        default:
          // Strict Prompt Weighted Formula: Quality (35%), Capability (30%), Reliability (15%), Latency (10%), Cost (10%)
          totalScore =
            (qualityScoreNorm * 0.35) +
            (capabilityMatchNorm * 0.30) +
            (reliabilityNorm * 0.15) +
            (latencyScoreNorm * 0.10) +
            (costScoreNorm * 0.10);
          break;
      }
    }

    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      totalScore: Number(totalScore.toFixed(2)),
      costScore: Number(costScoreNorm.toFixed(1)),
      latencyScore: Number(latencyScoreNorm.toFixed(1)),
      qualityScore: Number(qualityScoreNorm.toFixed(1)),
      domainMatchScore: capabilityMatchNorm,
      estimatedCost,
      estimatedLatency,
      disqualified,
      disqualifyReason
    };
  });

  // Sort by totalScore descending (non-disqualified first)
  scores.sort((a, b) => {
    if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
    return b.totalScore - a.totalScore;
  });

  // Select winning model candidate
  let selectedScore = scores.find(s => !s.disqualified) || scores[0];
  let fallbackTriggered = false;

  // Check if winning candidate requires fallback (degraded/offline)
  let winningModel = availableModels.find(m => m.id === selectedScore.modelId);
  if (!winningModel || winningModel.status === 'Degraded' || !winningModel.active) {
    fallbackTriggered = true;
    for (const fbId of fallbackChain) {
      const fbModel = availableModels.find(m => m.id === fbId && m.active && m.status === 'Operational');
      if (fbModel) {
        winningModel = fbModel;
        break;
      }
    }
  }

  if (!winningModel) {
    winningModel = models.find(m => m.active) || models[0];
  }

  // Cost baseline comparison against GPT-4o
  const gpt4o = models.find(m => m.id === 'gpt-4o') || models[0];
  const baselineCost = ((promptTokens * gpt4o.inputCost) + (completionTokens * gpt4o.outputCost)) / 1000000;
  const winnerInputCost = (promptTokens * winningModel.inputCost) / 1000000;
  const winnerOutputCost = (completionTokens * winningModel.outputCost) / 1000000;
  const estimatedCost = winnerInputCost + winnerOutputCost;
  const costSavings = Math.max(0, baselineCost - estimatedCost);
  const savingsPercent = baselineCost > 0 ? Number(((costSavings / baselineCost) * 100).toFixed(1)) : 0;

  // Build decision reasoning explanation
  let decisionReason = '';
  if (matchedRule) {
    decisionReason = `Rule Match: "${matchedRule.name}" forced route to ${winningModel.name}.`;
  } else if (fallbackTriggered) {
    decisionReason = `Primary candidate unavailable or degraded. Triggered Fallback Cascade to ${winningModel.name}.`;
  } else {
    decisionReason = `Evaluated multi-criteria utility weights [Quality: 35%, Capability: 30%, Reliability: 15%, Latency: 10%, Cost: 10%]. ${winningModel.name} scored highest (${selectedScore.totalScore} pts).`;
  }

  // Generate domain-tailored mock response
  const simulatedResponse = generateSimulatedResponse(prompt, winningModel, promptAnalysis);

  const result: RoutingResult = {
    id: `req-${Date.now().toString().slice(-6)}`,
    prompt,
    strategy,
    selectedModel: winningModel,
    promptAnalysis,
    allScores: scores,
    decisionReason,
    executionTimeMs: winningModel.avgLatencyMs,
    promptTokens,
    completionTokens,
    estimatedCost,
    baselineCost,
    costSavings,
    savingsPercent,
    simulatedResponse,
    fallbackTriggered,
    fallbackChain,
    timestamp: new Date().toISOString()
  };

  return result;
}

/**
 * Generates structured simulated response tailored to prompt domain & model metadata.
 */
export function generateSimulatedResponse(prompt: string, model: Model, analysis: PromptAnalysis): string {
  const modelHeader = `[Simulated response by ${model.name} (${model.provider}) • Latency: ~${model.avgLatencyMs}ms • Domain: ${analysis.detectedDomain}]`;

  if (analysis.detectedDomain === 'Code' || analysis.requiresCode) {
    return `${modelHeader}

Here is a robust implementation addressing your coding request:

\`\`\`typescript
// ModelMesh AI Generated Code Payload
export async function processTaskQueue<T>(
  items: T[],
  workerFn: (item: T) => Promise<void>,
  concurrency = 4
): Promise<void> {
  const active: Promise<void>[] = [];
  
  for (const item of items) {
    const p = workerFn(item).then(() => {
      active.splice(active.indexOf(p), 1);
    });
    active.push(p);
    
    if (active.length >= concurrency) {
      await Promise.race(active);
    }
  }
  
  await Promise.all(active);
}
\`\`\`

### Architectural Notes:
1. **Concurrency Pool Control**: Limits parallel in-flight async promises to ${model.name} bounds.
2. **Zero Dependency Footprint**: Pure TypeScript implementation for microservice gateways.`;
  }

  if (analysis.detectedDomain === 'Math') {
    return `${modelHeader}

### Analytical Mathematical Resolution

**Query Statement:** "${prompt.length > 70 ? prompt.slice(0, 70) + '...' : prompt}"

#### Step 1: Formulation & Boundary Conditions
Evaluating sequence boundary limit:
$$\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e \\approx 2.71828$$

#### Step 2: Proof Verification
By Bernoulli's Inequality and Monotone Convergence Theorem:
1. Sequence $a_n$ is strictly monotonic increasing.
2. Sequence $a_n$ is bounded above by $3$.

$$\\mathbf{Q.E.D.}$$`;
  }

  if (analysis.detectedDomain === 'Reasoning') {
    return `${modelHeader}

### Executive Analysis & Strategic Evaluation

Addressing query: **"${prompt}"**

#### 1. Primary Trade-Off Analysis
- **Quality SLA**: High intelligence requirements favor top-tier models (Claude 3.5 Sonnet / o3-mini).
- **Cost Reduction**: Routing non-critical queries to DeepSeek V3 yields up to 90% savings.

#### 2. Key Takeaways
1. Dynamic model selection prevents single-provider outages.
2. Automatic fallback cascade ensures 99.99% uptime.`;
  }

  // Default / General / Speed response
  return `${modelHeader}

Here is the concise summary for your query:

1. **Classification**: Domain: **${analysis.detectedDomain}** • Complexity: **${analysis.complexityScore}/10**.
2. **Routing Decision**: Routed to **${model.name}** (${model.provider}) as the optimal LLM.
3. **Execution Metrics**: 
   - Estimated Latency: ~${model.avgLatencyMs}ms
   - Tokens: ${analysis.tokenCount} prompt tokens
   - Provider Status: Operational`;
}
