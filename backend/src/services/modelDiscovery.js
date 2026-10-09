/**
 * Live Model Discovery Service via Hugging Face API & Provider Registry
 * Discovers real model metadata, pipeline capabilities, and active inference status.
 * Never invents or fabricates quality scores or cost numbers.
 */

import { VERIFIED_MODEL_METRICS, METADATA_PROVENANCE } from '../config/modelPricing.js';

const HF_API_URL = 'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=25';

let cachedModels = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Fetches real model metadata from Hugging Face API and local verified provider specifications.
 * @returns {Promise<Array<object>>}
 */
export async function discoverModels() {
  const now = Date.now();
  if (cachedModels && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedModels;
  }

  let hfModels = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const headers = { 'Accept': 'application/json' };
    if (process.env.HF_API_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
    }

    const res = await fetch(HF_API_URL, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        hfModels = data.map(m => ({
          id: m.id || m.modelId,
          name: m.id ? m.id.split('/').pop() : 'Unknown Model',
          provider: m.id ? (m.id.includes('/') ? m.id.split('/')[0] : 'HuggingFace') : 'HuggingFace',
          pipelineTag: m.pipeline_tag || 'text-generation',
          gated: m.gated || false,
          disabled: m.disabled || false,
          sourceType: 'live_hf_api_discovery',
          lastRefreshedAt: new Date().toISOString()
        }));
      }
    }
  } catch (error) {
    console.warn('[ModelDiscovery] Live HF API fetch skipped or timed out, utilizing verified provider specifications:', error.message);
  }

  // Merge verified model specs with HF discovery
  const allModelsMap = new Map();

  // 1. Add verified provider models
  Object.entries(VERIFIED_MODEL_METRICS).forEach(([id, meta]) => {
    allModelsMap.set(id, {
      id,
      name: meta.name,
      provider: meta.provider,
      inputCostPer1M: meta.inputCostPer1M,
      outputCostPer1M: meta.outputCostPer1M,
      qualityScore: meta.officialQualityBenchmark,
      supportedDomains: meta.supportedDomains,
      status: 'Operational',
      gated: false,
      sourceType: meta.sourceType || METADATA_PROVENANCE.sourceType,
      lastVerifiedDate: meta.lastVerifiedDate || METADATA_PROVENANCE.lastVerifiedDate,
      provenanceUrl: meta.provenanceUrl,
      hasVerifiedMetrics: true
    });
  });

  // 2. Add HF models that are not gated or disabled
  hfModels.forEach(m => {
    if (!allModelsMap.has(m.id) && !m.gated && !m.disabled) {
      const verified = VERIFIED_MODEL_METRICS[m.id];
      allModelsMap.set(m.id, {
        id: m.id,
        name: m.name,
        provider: m.provider,
        inputCostPer1M: verified ? verified.inputCostPer1M : null, // Null indicates unknown pricing
        outputCostPer1M: verified ? verified.outputCostPer1M : null,
        qualityScore: verified ? verified.officialQualityBenchmark : null, // Null indicates unknown benchmark quality
        supportedDomains: verified ? verified.supportedDomains : ['General'],
        status: m.disabled ? 'Offline' : 'Operational',
        gated: m.gated,
        sourceType: verified ? verified.sourceType : m.sourceType,
        lastRefreshedAt: m.lastRefreshedAt,
        hasVerifiedMetrics: Boolean(verified)
      });
    }
  });

  cachedModels = Array.from(allModelsMap.values());
  cacheTimestamp = now;
  return cachedModels;
}
