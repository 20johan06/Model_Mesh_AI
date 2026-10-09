/**
 * Official Verified Model Pricing & Benchmark Reference Database
 * Source Type: Manually maintained official provider specifications & benchmarks.
 * Last Verified: 2026-10-09
 * Provenance: Official provider pricing documentation (OpenAI, Anthropic, DeepSeek, Meta HF Free Tier).
 */

export const METADATA_PROVENANCE = {
  sourceType: 'manually_maintained_official_spec',
  lastVerifiedDate: '2026-10-09',
  isLiveMeasurement: false
};

export const VERIFIED_MODEL_METRICS = {
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    officialQualityBenchmark: 92.5, // MMLU / HumanEval benchmark average
    supportedDomains: ['Code', 'Math', 'Reasoning', 'Creative', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://openai.com/api/pricing/'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    officialQualityBenchmark: 82.0,
    supportedDomains: ['Speed', 'General', 'Code'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://openai.com/api/pricing/'
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    officialQualityBenchmark: 93.7,
    supportedDomains: ['Code', 'Reasoning', 'Creative', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://www.anthropic.com/pricing'
  },
  'deepseek-v3': {
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    officialQualityBenchmark: 88.5,
    supportedDomains: ['Code', 'Math', 'Reasoning', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://www.deepseek.com/'
  },
  'meta-llama/Llama-3.3-70B-Instruct': {
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    inputCostPer1M: 0.00, // Serverless Hugging Face Inference API Free Tier
    outputCostPer1M: 0.00,
    officialQualityBenchmark: 86.2,
    supportedDomains: ['Code', 'Reasoning', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://huggingface.co/docs/api-inference/'
  },
  'Qwen/Qwen2.5-Coder-32B-Instruct': {
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    officialQualityBenchmark: 85.4,
    supportedDomains: ['Code'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-09',
    provenanceUrl: 'https://huggingface.co/docs/api-inference/'
  },
  'gemini-3.8-flash': {
    name: 'Gemini 3.8 Flash',
    provider: 'Google Gemini',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    officialQualityBenchmark: 90.0,
    supportedDomains: ['Code', 'Math', 'Reasoning', 'Creative', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-10',
    provenanceUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google Gemini',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    officialQualityBenchmark: 88.0,
    supportedDomains: ['Code', 'Math', 'Reasoning', 'General'],
    sourceType: 'manually_maintained_official_spec',
    lastVerifiedDate: '2026-10-10',
    provenanceUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
  }
};
