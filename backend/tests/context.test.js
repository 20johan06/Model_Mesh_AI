/**
 * Test Suite for ModelMesh AI Adaptive Context Layer
 * Tests query understanding, context management, privacy filtering, and API handlers.
 */

import assert from 'node:assert/strict';
import { analyzeQuery } from '../src/services/queryUnderstanding.js';
import { processContext } from '../src/services/contextManager.js';
import { filterPrivacy, filterPrivacyContext } from '../src/services/privacyFilter.js';
import { validateQueryInput, ValidationError, PayloadTooLargeError } from '../src/utils/validation.js';

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('\n--- Running Adaptive Context Layer Unit Tests ---\n');

// 1. Classification Tests
test('1a. Classification - Coding query', () => {
  const res = analyzeQuery('Write a Rust async function using Tokio to query a database');
  assert.equal(res.taskType, 'coding');
  assert.equal(res.constraints.language, 'Rust');
});

test('1b. Classification - Mathematics query', () => {
  const res = analyzeQuery('Solve the integral equation limit as n approaches infinity');
  assert.equal(res.taskType, 'mathematics');
});

test('1c. Classification - Creative writing query', () => {
  const res = analyzeQuery('Write a poem about space exploration in short format');
  assert.equal(res.taskType, 'creative');
  assert.equal(res.constraints.brevity, 'concise');
});

test('1d. Classification - Summarization query', () => {
  const res = analyzeQuery('Summarize the key takeaways from this technical report');
  assert.equal(res.taskType, 'summarization');
});

test('1e. Classification - General query', () => {
  const res = analyzeQuery('What is the capital of France?');
  assert.equal(res.taskType, 'factual');
});

// 2. Empty / Invalid Query Rejection
test('2a. Empty query rejection', () => {
  assert.throws(() => validateQueryInput(''), ValidationError);
  assert.throws(() => validateQueryInput('   '), ValidationError);
  assert.throws(() => validateQueryInput(null), ValidationError);
});

test('2b. Invalid input type rejection', () => {
  assert.throws(() => validateQueryInput(12345), ValidationError);
  assert.throws(() => validateQueryInput(true), ValidationError);
  assert.throws(() => validateQueryInput(['invalid']), ValidationError);
});

// 3. Max Input Length Enforcement
test('4. Maximum input-length enforcement', () => {
  const hugeQuery = 'a'.repeat(10001);
  assert.throws(() => processContext({ query: hugeQuery, maxQueryLength: 10000 }), PayloadTooLargeError);
});

// 4. Optional Context Size Limits
test('5. Optional context size limits', () => {
  const hugeContext = { data: 'x'.repeat(5001) };
  assert.throws(() => processContext({ query: 'valid query', context: hugeContext, maxContextLength: 5000 }), PayloadTooLargeError);
});

// 5. Email and Phone Redaction
test('6. Email and phone redaction', () => {
  const input = 'Contact user at john.doe@example.com or call +1 (555) 019-2834 for support.';
  const res = filterPrivacy(input);
  assert.equal(res.hasRedactions, true);
  assert.equal(res.summary.emailCount, 1);
  assert.equal(res.summary.phoneCount, 1);
  assert.ok(res.redactedQuery.includes('[REDACTED_EMAIL]'));
  assert.ok(res.redactedQuery.includes('[REDACTED_PHONE]'));
  assert.ok(!res.redactedQuery.includes('john.doe@example.com'));
  assert.ok(!res.redactedQuery.includes('555-019-2834'));
});

// 6. API Token and Secret Pattern Redaction
test('7. API token or secret-pattern redaction', () => {
  const input = 'Here is my key: sk-proj-1234567890abcdef1234567890abcdef and secret_key = "super_secret_pass_123"';
  const res = filterPrivacy(input);
  assert.equal(res.hasRedactions, true);
  assert.equal(res.summary.apiKeyCount, 1);
  assert.equal(res.summary.secretCount, 1);
  assert.ok(res.redactedQuery.includes('[REDACTED_API_KEY]'));
  assert.ok(res.redactedQuery.includes('[REDACTED_SECRET]'));
  assert.ok(!res.redactedQuery.includes('sk-proj-1234567890abcdef1234567890abcdef'));
  assert.ok(!res.redactedQuery.includes('super_secret_pass_123'));
});

// 7. Optional Context Secret Redaction
test('8. Optional context secret redaction', () => {
  const query = 'Analyze this user query';
  const contextObj = {
    conversationSummary: 'Previous email was admin@secretcorp.org',
    userKey: 'sk-proj-9876543210fedcba9876543210fedcba'
  };

  const res = filterPrivacyContext(query, contextObj);
  assert.equal(res.hasRedactions, true);
  assert.equal(res.summary.emailCount, 1);
  assert.equal(res.summary.apiKeyCount, 1);
  assert.ok(!JSON.stringify(res.redactedContext).includes('admin@secretcorp.org'));
  assert.ok(!JSON.stringify(res.redactedContext).includes('sk-proj-9876543210fedcba9876543210fedcba'));
  assert.ok(JSON.stringify(res.redactedContext).includes('[REDACTED_EMAIL]'));
  assert.ok(JSON.stringify(res.redactedContext).includes('[REDACTED_API_KEY]'));
});

// 8. Synthetic Hugging Face token redaction (hf_ prefixed)
test('9. Synthetic Hugging Face token redaction in query and context', () => {
  const query = 'Download model using hf_SyntheticTokenForTesting1234567890';
  const contextObj = { hfToken: 'hf_AnotherSyntheticHfToken9876543210' };

  const res = filterPrivacyContext(query, contextObj);
  const analysis = analyzeQuery(res.redactedQuery);

  assert.equal(res.hasRedactions, true);
  assert.equal(res.summary.apiKeyCount, 2);
  assert.ok(res.redactedQuery.includes('[REDACTED_API_KEY]'));
  assert.ok(!res.redactedQuery.includes('hf_SyntheticTokenForTesting1234567890'));
  assert.ok(!JSON.stringify(res.redactedContext).includes('hf_AnotherSyntheticHfToken9876543210'));
  assert.ok(!analysis.intent.includes('hf_SyntheticTokenForTesting1234567890'));
});

// 9. Preservation of Ordinary Text
test('10. Preservation of ordinary text', () => {
  const input = 'Please write a JavaScript function to filter an array of numbers.';
  const res = filterPrivacy(input);
  assert.equal(res.hasRedactions, false);
  assert.equal(res.redactedQuery, input);
});

// 10. Mixed Query with Multiple Patterns
test('11. Mixed query containing ordinary text and multiple sensitive patterns', () => {
  const rawInput = 'Refactor code for alice@dev.org using token ghp_1234567890abcdef1234567890abcdef1234 and phone +1-800-555-0199 urgently.';
  const normalized = processContext({ query: rawInput });
  const privacy = filterPrivacyContext(normalized.normalizedQuery);
  const analysis = analyzeQuery(privacy.redactedQuery);

  assert.equal(analysis.taskType, 'coding');
  assert.equal(privacy.hasRedactions, true);
  assert.equal(privacy.summary.emailCount, 1);
  assert.equal(privacy.summary.phoneCount, 1);
  assert.equal(privacy.summary.apiKeyCount, 1);

  // Assert raw secrets are absent from query, intent, and redacted output
  assert.ok(!privacy.redactedQuery.includes('alice@dev.org'));
  assert.ok(!privacy.redactedQuery.includes('ghp_1234567890abcdef1234567890abcdef1234'));
  assert.ok(!privacy.redactedQuery.includes('+1-800-555-0199'));
  assert.ok(!analysis.intent.includes('alice@dev.org'));
  assert.ok(!analysis.intent.includes('ghp_1234567890abcdef1234567890abcdef1234'));
});

console.log(`\nAll ${passedTests}/${totalTests} tests passed successfully!\n`);
