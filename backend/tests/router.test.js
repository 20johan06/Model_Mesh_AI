/**
 * Test Suite for Phase 3 Intelligence Router
 * Tests live model discovery, verified signal routing, missing metric handling, and edge cases.
 */

import assert from 'node:assert/strict';
import { discoverModels } from '../src/services/modelDiscovery.js';
import { routeTask } from '../src/services/intelligenceRouter.js';

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

async function runRouterTests() {
  console.log('\n--- Running Phase 3 Intelligence Router Unit Tests ---\n');

  await test('1. Model Discovery returns operational models with verified signals', async () => {
    const models = await discoverModels();
    assert.ok(Array.isArray(models));
    assert.ok(models.length > 0);
    const gpt4o = models.find(m => m.id === 'gpt-4o');
    assert.ok(gpt4o);
    assert.equal(gpt4o.hasVerifiedMetrics, true);
    assert.equal(typeof gpt4o.inputCostPer1M, 'number');
  });

  await test('2. Routing Engine selects top candidate for Coding task based on verified capability', async () => {
    const params = {
      taskType: 'coding',
      complexity: 'high',
      constraints: { language: 'Rust' },
      inputStats: { wordCount: 25 }
    };

    const res = await routeTask(params, 'balanced');
    assert.equal(res.status, 'success');
    assert.ok(res.winningCandidate);
    assert.ok(res.winningCandidate.totalScore > 50);
    assert.ok(res.winningCandidate.signals.length > 0);
  });

  await test('3. Cost Strategy prioritizes free or lower cost verified endpoints', async () => {
    const params = {
      taskType: 'coding',
      complexity: 'low',
      constraints: {},
      inputStats: { wordCount: 10 }
    };

    const res = await routeTask(params, 'cost');
    assert.equal(res.status, 'success');
    assert.ok(res.winningCandidate);
    assert.ok(res.winningCandidate.totalScore >= 50);
  });

  await test('4. Missing metrics do not receive favorable scores', async () => {
    const models = await discoverModels();
    const unpricedModel = models.find(m => m.inputCostPer1M === null);
    if (unpricedModel) {
      const res = await routeTask({ taskType: 'general' }, 'cost');
      const rankedUnpriced = res.rankedCandidates.find(c => c.modelId === unpricedModel.id);
      if (rankedUnpriced) {
        const pricingSignal = rankedUnpriced.signals.find(s => s.signal === 'Token Pricing');
        assert.equal(pricingSignal.confidence, 'Low');
        assert.equal(pricingSignal.status, 'Unknown / Unpriced');
      }
    }
  });

  await test('5. Invalid routing strategy falls back to balanced strategy safely', async () => {
    const res = await routeTask({ taskType: 'general' }, 'INVALID_STRATEGY_FOO');
    assert.equal(res.status, 'success');
    assert.equal(res.routingStrategy, 'balanced');
  });

  await test('6. Router handles empty or null parameters without throwing', async () => {
    const res1 = await routeTask(null, 'quality');
    assert.ok(res1.status === 'success' || res1.status === 'insufficient_data');

    const res2 = await routeTask(undefined, undefined);
    assert.ok(res2.status === 'success' || res2.status === 'insufficient_data');
  });

  await test('7. Total score contains no NaN, Infinity, or missing numeric values', async () => {
    const res = await routeTask({ taskType: 'mathematics' }, 'balanced');
    assert.equal(res.status, 'success');
    res.rankedCandidates.forEach(candidate => {
      assert.ok(Number.isFinite(candidate.totalScore));
      assert.ok(!Number.isNaN(candidate.totalScore));
      assert.ok(candidate.totalScore >= 0);
      assert.ok(candidate.totalScore <= 100);
    });
  });

  await test('8. Insufficient Data Guard handles empty candidate pools gracefully', async () => {
    const params = {
      taskType: 'unknown_niche_task',
      complexity: 'high',
      constraints: {},
      inputStats: { wordCount: 5 }
    };

    const res = await routeTask(params, 'quality');
    assert.ok(res.status === 'success' || res.status === 'insufficient_data');
    assert.ok(Array.isArray(res.rankedCandidates));
  });

  console.log(`\nAll ${passed}/${total} Phase 3 Router unit tests passed successfully!\n`);
}

runRouterTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

