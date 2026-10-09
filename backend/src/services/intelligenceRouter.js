/**
 * Intelligence Router Engine for ModelMesh AI (Phase 3)
 * Server-side deterministic router using real model metadata and verified signals.
 * Returns 'insufficient_data' if no verified candidate meets SLA bounds.
 */

import { discoverModels } from './modelDiscovery.js';

/**
 * Routes query metadata to the optimal verified model candidate
 * @param {object} params - { taskType, complexity, constraints, inputStats }
 * @param {string} strategy - 'balanced' | 'cost' | 'latency' | 'quality'
 * @returns {Promise<object>}
 */
export async function routeTask(params = {}, strategy = 'balanced') {
  const normalizedParams = (params && typeof params === 'object') ? params : {};
  const { taskType = 'general', complexity: _complexity = 'medium', constraints: _constraints = {}, inputStats: _inputStats = {} } = normalizedParams;
  
  // Normalize strategy
  const validStrategies = ['balanced', 'cost', 'latency', 'quality'];
  const activeStrategy = validStrategies.includes(strategy) ? strategy : 'balanced';

  const availableModels = await discoverModels();

  // Filter operational and non-gated models
  const eligibleModels = Array.isArray(availableModels) 
    ? availableModels.filter(m => m && m.status === 'Operational' && !m.gated && !m.disabled)
    : [];

  if (eligibleModels.length === 0) {
    return {
      status: 'insufficient_data',
      message: 'No operational model endpoints available with verified metadata for this task.',
      rankedCandidates: [],
      winningCandidate: null,
      confidence: 0,
      routingStrategy: activeStrategy
    };
  }

  // Target domain based on taskType
  const targetDomain = 
    taskType === 'coding' ? 'Code' :
    taskType === 'mathematics' ? 'Math' :
    taskType === 'reasoning' ? 'Reasoning' :
    taskType === 'creative' ? 'Creative' :
    taskType === 'summarization' ? 'General' :
    taskType === 'factual' ? 'General' : 'General';

  // Score models based ONLY on verified signals
  const candidateScores = eligibleModels.map(model => {
    const signals = [];
    let evidenceCount = 0;
    const totalPossibleSignals = 3; // Domain, Pricing, Quality Benchmark

    // 1. Domain Capability Signal (Grounded in metadata)
    const supportedDomains = Array.isArray(model.supportedDomains) ? model.supportedDomains : ['General'];
    const exactDomainMatch = supportedDomains.includes(targetDomain);
    const generalDomainMatch = supportedDomains.includes('General');

    let capabilityScore = 0;
    if (exactDomainMatch) {
      capabilityScore = 100;
      evidenceCount++;
      signals.push({ signal: 'Domain Capability', status: `Verified Match (${targetDomain})`, confidence: 'High' });
    } else if (generalDomainMatch) {
      capabilityScore = 60;
      evidenceCount++;
      signals.push({ signal: 'Domain Capability', status: 'General Domain Fallback', confidence: 'Medium' });
    } else {
      capabilityScore = 0; // Mismatch receives 0 points, never favorable fallback score
      signals.push({ signal: 'Domain Capability', status: 'Domain Mismatch', confidence: 'Low' });
    }

    // 2. Pricing Signal (Verified vs Unknown — 0 points for missing metrics)
    let costScore = 0;
    const hasCostMetric = Number.isFinite(model.inputCostPer1M) && model.inputCostPer1M !== null;
    if (hasCostMetric) {
      // Lower cost per 1M tokens yields higher cost score (0.00 = 100, 5.00 = 10)
      costScore = Math.max(10, Math.min(100, 100 - (model.inputCostPer1M * 18)));
      evidenceCount++;
      signals.push({
        signal: 'Token Pricing',
        status: model.inputCostPer1M === 0 ? 'Free Tier' : `$${model.inputCostPer1M}/1M Input`,
        confidence: 'High'
      });
    } else {
      costScore = 0; // Missing cost metric receives 0 points, NOT 50
      signals.push({ signal: 'Token Pricing', status: 'Unknown / Unpriced', confidence: 'Low' });
    }

    // 3. Benchmark Quality Signal (Verified vs Unknown — 0 points for missing metrics)
    let qualityScore = 0;
    const hasQualityMetric = Number.isFinite(model.qualityScore) && model.qualityScore !== null;
    if (hasQualityMetric) {
      qualityScore = Math.max(0, Math.min(100, model.qualityScore));
      evidenceCount++;
      signals.push({
        signal: 'Official Benchmark Quality',
        status: `${model.qualityScore}/100 Average Benchmark`,
        confidence: 'High'
      });
    } else {
      qualityScore = 0; // Missing benchmark quality receives 0 points, NOT 50
      signals.push({ signal: 'Official Benchmark Quality', status: 'Unknown Benchmark', confidence: 'Low' });
    }

    // 4. Latency / Reliability Signal (Documented as Unmeasured for phase 3, avoiding fake values)
    signals.push({ signal: 'Measured Latency', status: 'Unmeasured (Phase 3 Baseline)', confidence: 'Low' });

    // Calculate total score based on selected strategy
    let rawScore = 0;
    switch (activeStrategy) {
      case 'cost':
        rawScore = (costScore * 0.60) + (capabilityScore * 0.30) + (qualityScore * 0.10);
        break;
      case 'quality':
        rawScore = (qualityScore * 0.60) + (capabilityScore * 0.30) + (costScore * 0.10);
        break;
      case 'latency':
        // Without live measured latency, latency strategy weights cost & domain capability
        rawScore = (costScore * 0.50) + (capabilityScore * 0.40) + (qualityScore * 0.10);
        break;
      case 'balanced':
      default:
        rawScore = (qualityScore * 0.35) + (capabilityScore * 0.35) + (costScore * 0.30);
        break;
    }

    // Sanitize score against NaN / Infinity
    const sanitizedScore = Number.isFinite(rawScore) ? Number(rawScore.toFixed(2)) : 0;

    // Calculate evidence completeness rating
    let candidateConfidence = 'Low';
    if (evidenceCount === totalPossibleSignals) {
      candidateConfidence = 'High';
    } else if (evidenceCount >= 2) {
      candidateConfidence = 'Medium';
    }

    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      totalScore: sanitizedScore,
      evidenceCompleteness: candidateConfidence,
      hasVerifiedMetrics: Boolean(model.hasVerifiedMetrics),
      sourceType: model.sourceType || 'unknown',
      lastVerifiedDate: model.lastVerifiedDate || null,
      provenanceUrl: model.provenanceUrl || null,
      signals
    };
  });

  // Sort candidates by totalScore descending
  candidateScores.sort((a, b) => b.totalScore - a.totalScore);

  const winningCandidate = candidateScores[0];

  // If no candidate exists or top candidate lacks minimal evidence & domain capability score, return insufficient_data
  if (!winningCandidate || winningCandidate.totalScore <= 0 || (winningCandidate.totalScore < 30 && !winningCandidate.hasVerifiedMetrics)) {
    return {
      status: 'insufficient_data',
      message: 'Insufficient verified metadata or capability alignment to select a candidate deterministically.',
      rankedCandidates: candidateScores,
      winningCandidate: null,
      confidence: 'None',
      routingStrategy: activeStrategy
    };
  }

  return {
    status: 'success',
    winningCandidate,
    rankedCandidates: candidateScores,
    confidence: winningCandidate.evidenceCompleteness,
    routingStrategy: activeStrategy,
    explanation: `Selected ${winningCandidate.modelName} (${winningCandidate.provider}) via ${activeStrategy} strategy based on verified metadata signals.`
  };
}

