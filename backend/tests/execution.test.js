/**
 * Phase 4 Multi-LLM Execution Unit Test Suite
 * Uses mocked global fetch responses to verify text generation, missing credentials,
 * authentication errors, quota exhaustion, unsupported models, timeouts, retries,
 * bounded candidate fallback, provider filtering, and secret redaction.
 * 
 * NOTE: Automated unit tests use mocked HTTP responses for deterministic validation.
 * They DO NOT constitute proof of live third-party API authentication.
 */

import assert from 'node:assert/strict';
import { executeSingleLLMCall, executeGeminiLLMCall, executeStabilityImageGeneration, executeLLMWithFallback, isHuggingFaceCompatibleModel } from '../src/services/llmExecution.js';

let passed = 0;
let total = 0;

function test(desc, fn) {
  total++;
  return fn()
    .then(() => {
      passed++;
      console.log(`  ✓ ${desc}`);
    })
    .catch((err) => {
      console.error(`  ✗ ${desc}`);
      console.error(`    ${err.message}`);
      throw err;
    });
}

const originalFetch = globalThis.fetch;

async function runExecutionTests() {
  console.log('\n--- Running Phase 4 Multi-LLM Execution Unit Tests ---\n');

  process.env.STRICT_CREDENTIALS = 'true';
  process.env.LLM_PROVIDER = 'huggingface';

  // Test 1: Successful Text Generation Execution
  await test('1. Successful Text Generation returns parsed output & real latency', async () => {
    process.env.HF_API_TOKEN = 'test_hf_token_123';

    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes('chat/completions'));
      assert.equal(opts.headers.Authorization, 'Bearer test_hf_token_123');
      return {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ choices: [{ message: { content: 'Test generated code response from LLM.' } }] })
      };
    };

    const res = await executeSingleLLMCall({
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      prompt: 'Write a hello world function in JavaScript',
      taskType: 'coding'
    });

    assert.equal(res.success, true);
    assert.equal(res.output, 'Test generated code response from LLM.');
    assert.ok(typeof res.realLatencyMs === 'number');
    assert.equal(res.provider, 'HuggingFace');
  });

  // Test 2: Missing Credentials Rejection
  await test('2. Missing HF_API_TOKEN returns 401 HF_AUTH_MISSING error', async () => {
    const originalToken = process.env.HF_API_TOKEN;
    delete process.env.HF_API_TOKEN;

    const res = await executeSingleLLMCall({
      modelId: 'meta-llama/Meta-Llama-3-8B-Instruct',
      prompt: 'Hello world'
    });

    process.env.HF_API_TOKEN = originalToken || 'test_hf_token_123';

    assert.equal(res.success, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.errorType, 'HF_AUTH_MISSING');
  });

  // Test 3: HTTP 401 Auth Error Short-Circuits Iteration
  await test('3. HTTP 401 Auth Error stops candidate iteration immediately', async () => {
    process.env.HF_API_TOKEN = 'invalid_hf_token';

    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: false,
        status: 401,
        text: async () => 'Invalid token'
      };
    };

    const candidates = [
      { modelId: 'org/model-a', provider: 'Meta' },
      { modelId: 'org/model-b', provider: 'Qwen' },
      { modelId: 'org/model-c', provider: 'Mistral' }
    ];

    const res = await executeLLMWithFallback({
      rankedCandidates: candidates,
      prompt: 'Hello world'
    });

    assert.equal(res.status, 'auth_error');
    assert.equal(fetchCount, 1); // Short-circuited after 1st attempt!
    assert.equal(res.attemptedCandidates.length, 1);
  });

  // Test 4: HTTP 402 Credit Quota Exhaustion Short-Circuits Iteration
  await test('4. HTTP 402 Credit Quota Exhaustion stops candidate iteration and returns quota_error', async () => {
    process.env.HF_API_TOKEN = 'valid_token_out_of_credits';

    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: false,
        status: 402,
        text: async () => 'You have no remaining credits. Purchase pre-paid credits to continue using Inference Providers.'
      };
    };

    const candidates = [
      { modelId: 'org/model-a', provider: 'Meta' },
      { modelId: 'org/model-b', provider: 'Qwen' }
    ];

    const res = await executeLLMWithFallback({
      rankedCandidates: candidates,
      prompt: 'Write code'
    });

    assert.equal(res.status, 'quota_error');
    assert.equal(fetchCount, 1); // Short-circuited after 1st attempt!
    assert.equal(res.attemptedCandidates.length, 1);
  });

  // Test 5: Provider Timeout Handling
  await test('5. Provider Timeout triggers AbortError and returns 504 status', async () => {
    process.env.HF_API_TOKEN = 'test_hf_token_123';

    globalThis.fetch = async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    };

    const res = await executeSingleLLMCall({
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      prompt: 'Summarize quantum mechanics',
      timeoutMs: 10
    });

    assert.equal(res.success, false);
    assert.equal(res.errorType, 'HF_TIMEOUT');
    assert.equal(res.statusCode, 504);
  });

  // Test 6: Proprietary Provider Model Filtering
  await test('6. Proprietary Provider Models (gpt-4o, claude-3-5-sonnet, deepseek-v3) are filtered out', async () => {
    assert.equal(isHuggingFaceCompatibleModel({ id: 'gpt-4o', provider: 'OpenAI' }), false);
    assert.equal(isHuggingFaceCompatibleModel({ id: 'claude-3-5-sonnet', provider: 'Anthropic' }), false);
    assert.equal(isHuggingFaceCompatibleModel({ id: 'deepseek-v3', provider: 'DeepSeek' }), false);

    assert.equal(isHuggingFaceCompatibleModel({ id: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' }), true);
    assert.equal(isHuggingFaceCompatibleModel({ id: 'Qwen/Qwen2.5-Coder-32B-Instruct', provider: 'Qwen' }), true);
  });

  // Test 7: Fallback Skips Proprietary Candidates and Invokes Compatible HF Models
  await test('7. Fallback skips proprietary candidates and executes top compatible Hugging Face model', async () => {
    process.env.HF_API_TOKEN = 'test_hf_token_123';

    let calledUrl = '';
    globalThis.fetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'Compatible HF model output.' } }] })
      };
    };

    const candidates = [
      { modelId: 'gpt-4o', provider: 'OpenAI' },
      { modelId: 'claude-3-5-sonnet', provider: 'Anthropic' },
      { modelId: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' }
    ];

    const res = await executeLLMWithFallback({
      rankedCandidates: candidates,
      prompt: 'Write Rust async Tokio code'
    });

    assert.equal(res.status, 'success');
    assert.equal(res.winningCandidate.modelId, 'meta-llama/Llama-3.3-70B-Instruct');
    assert.ok(calledUrl.includes('chat/completions'));
    assert.ok(!calledUrl.includes('gpt-4o'));
    assert.ok(!calledUrl.includes('claude'));
  });

  // Test 8: Empty Compatible Candidate Pool Returns Structured Error
  await test('8. Empty compatible candidate pool returns status: no_compatible_model', async () => {
    const candidates = [
      { modelId: 'gpt-4o', provider: 'OpenAI' },
      { modelId: 'deepseek-v3', provider: 'DeepSeek' }
    ];

    const res = await executeLLMWithFallback({
      rankedCandidates: candidates,
      prompt: 'Write code'
    });

    assert.equal(res.status, 'no_compatible_model');
    assert.equal(res.attemptedCandidates.length, 0);
  });

  // Test 9: Secret Redaction in Error Messages
  await test('9. Secret Redaction strips process.env tokens from error output', async () => {
    const sensitiveToken = 'hf_SecretSuperPrivateToken9876543210';
    process.env.HF_API_TOKEN = sensitiveToken;

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        text: async () => `Unauthorized request with token ${sensitiveToken} rejected.`
      };
    };

    const res = await executeSingleLLMCall({
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      prompt: 'Test secret protection'
    });

    assert.equal(res.success, false);
    assert.ok(!res.error.includes(sensitiveToken));
    assert.ok(res.error.includes('[REDACTED_HF_TOKEN]'));
  });

  // Test 10: HTTP 400 Unsupported Model is Skipped and Advances to Next Candidate
  await test('10. HTTP 400 Model Unsupported skips candidate and falls back to next eligible model', async () => {
    process.env.HF_API_TOKEN = 'test_hf_token_123';

    globalThis.fetch = async (url, opts) => {
      if (opts && opts.body && opts.body.includes('Llama-3.3-70B-Instruct')) {
        return {
          ok: false,
          status: 400,
          text: async () => 'Model meta-llama/Llama-3.3-70B-Instruct is not supported by provider hf-inference'
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'Response from fallback Meta-Llama-3-8B model.' } }] })
      };
    };

    const candidates = [
      { modelId: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' },
      { modelId: 'meta-llama/Meta-Llama-3-8B-Instruct', provider: 'Meta' }
    ];

    const res = await executeLLMWithFallback({
      rankedCandidates: candidates,
      prompt: 'Refactor code safely',
      taskType: 'coding'
    });

    assert.equal(res.status, 'success');
    assert.equal(res.winningCandidate.modelId, 'meta-llama/Meta-Llama-3-8B-Instruct');
    assert.equal(res.fallbackUsed, true);
    assert.equal(res.attemptCount, 2);
    assert.equal(res.attemptedCandidates[0].modelId, 'meta-llama/Llama-3.3-70B-Instruct');
    assert.equal(res.attemptedCandidates[0].statusCode, 400);
    assert.equal(res.attemptedCandidates[0].errorType, 'HF_MODEL_UNSUPPORTED');
  });

  // Test 11: Task Domain Compatibility Filtering
  await test('11. Task Domain Compatibility filters text models for image tasks and vice-versa', async () => {
    const textModel = { modelId: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' };
    const imageModel = { modelId: 'black-forest-labs/FLUX.1-schnell', provider: 'BlackForestLabs', pipelineTag: 'text-to-image' };

    assert.equal(isHuggingFaceCompatibleModel(textModel, 'coding'), true);
    assert.equal(isHuggingFaceCompatibleModel(imageModel, 'coding'), false);
    assert.equal(isHuggingFaceCompatibleModel(textModel, 'image_generation'), false);
    assert.equal(isHuggingFaceCompatibleModel(imageModel, 'image_generation'), true);
  });

  // Test 12: Gemini Successful Text Generation
  await test('12. Gemini Successful Text Generation returns parsed output & real latency', async () => {
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    globalThis.fetch = async (url) => {
      assert.ok(url.includes('generativelanguage.googleapis.com'));
      assert.ok(url.includes('key=test_gemini_key_123'));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello from Google Gemini 3.8 Flash!' }]
              }
            }
          ]
        })
      };
    };

    const res = await executeGeminiLLMCall({
      prompt: 'Say hello',
      modelId: 'gemini-3.8-flash'
    });

    assert.equal(res.success, true);
    assert.equal(res.output, 'Hello from Google Gemini 3.8 Flash!');
    assert.ok(typeof res.realLatencyMs === 'number');
    assert.equal(res.provider, 'Google Gemini');
  });

  // Test 13: Missing GEMINI_API_KEY Rejection
  await test('13. Missing GEMINI_API_KEY returns 401 GEMINI_AUTH_MISSING error', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';

    const res = await executeGeminiLLMCall({
      prompt: 'Hello world',
      modelId: 'gemini-3.8-flash'
    });

    process.env.GEMINI_API_KEY = origKey || 'test_gemini_key_123';

    assert.equal(res.success, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.errorType, 'GEMINI_AUTH_MISSING');
  });

  // Test 14: Gemini HTTP 429 Quota Exceeded
  await test('14. Gemini HTTP 429 Quota Exceeded returns quota_error in fallback', async () => {
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 429,
        text: async () => 'RESOURCE_EXHAUSTED: Quota exceeded for quota metric'
      };
    };

    const res = await executeLLMWithFallback({
      rankedCandidates: [],
      prompt: 'Write code'
    });

    assert.equal(res.status, 'quota_error');
    assert.ok(res.message.includes('Google Gemini API quota or rate limit exceeded'));
  });

  // Test 15: Gemini Provider Timeout Handling
  await test('15. Gemini Provider Timeout triggers AbortError and returns 504 status', async () => {
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';

    globalThis.fetch = async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    };

    const res = await executeGeminiLLMCall({
      prompt: 'Explain general relativity',
      modelId: 'gemini-3.8-flash',
      timeoutMs: 10
    });

    assert.equal(res.success, false);
    assert.equal(res.errorType, 'GEMINI_TIMEOUT');
    assert.equal(res.statusCode, 504);
  });

  // Test 16: LLM_PROVIDER=gemini Selection
  await test('16. LLM_PROVIDER=gemini selects Gemini and bypasses Hugging Face calls', async () => {
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';

    let calledUrl = '';
    globalThis.fetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Gemini execution output' }] } }]
        })
      };
    };

    const res = await executeLLMWithFallback({
      rankedCandidates: [{ modelId: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' }],
      prompt: 'Test provider selection'
    });

    assert.equal(res.status, 'success');
    assert.equal(res.winningCandidate.provider, 'Google Gemini');
    assert.ok(calledUrl.includes('generativelanguage.googleapis.com'));
    assert.ok(!calledUrl.includes('huggingface'));
  });

  // Test 17: LLM_PROVIDER=openrouter Selection
  await test('17. LLM_PROVIDER=openrouter selects OpenRouter and sends correct headers', async () => {
    process.env.LLM_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'sk-or-test-key-123';
    process.env.OPENROUTER_MODEL = 'poolside/laguna-s-2.1:free';

    let calledUrl = '';
    let calledHeaders = {};
    globalThis.fetch = async (url, opts) => {
      calledUrl = url;
      calledHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'def test_func(): return True' } }]
        })
      };
    };

    const res = await executeLLMWithFallback({
      rankedCandidates: [{ modelId: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'Meta' }],
      prompt: 'Write Python function'
    });

    assert.equal(res.status, 'success');
    assert.equal(res.winningCandidate.provider, 'OpenRouter');
    assert.ok(calledUrl.includes('openrouter.ai/api/v1/chat/completions'));
    assert.equal(calledHeaders.Authorization, 'Bearer sk-or-test-key-123');
    assert.equal(calledHeaders['HTTP-Referer'], 'http://localhost:3001');
  });

  // Test 18: Stability AI Image Generation Execution
  await test('18. Stability AI Image Generation sends correct headers and returns imageDataUri', async () => {
    process.env.STABILITY_API_KEY = 'sk-test-stability-key-123';

    let calledUrl = '';
    let calledHeaders = {};
    globalThis.fetch = async (url, opts) => {
      calledUrl = url;
      calledHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          finish_reason: 'SUCCESS',
          seed: 12345
        })
      };
    };

    const res = await executeStabilityImageGeneration({
      prompt: 'A futuristic city at sunset'
    });

    assert.equal(res.success, true);
    assert.equal(res.provider, 'Stability AI');
    assert.equal(res.modelId, 'stable-image-core');
    assert.ok(res.imageDataUri.startsWith('data:image/png;base64,iVBORw0KGgo'));
    assert.ok(calledUrl.includes('api.stability.ai/v2beta/stable-image/generate/core'));
    assert.equal(calledHeaders.Authorization, 'Bearer sk-test-stability-key-123');
  });

  // Restore original fetch
  globalThis.fetch = originalFetch;

  console.log(`\nAll ${passed}/${total} Phase 4 Multi-LLM Execution unit tests passed successfully!\n`);
}

runExecutionTests().catch(err => {
  globalThis.fetch = originalFetch;
  console.error('Phase 4 Test run failed:', err);
  process.exit(1);
});
