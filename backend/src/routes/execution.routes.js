/**
 * Express Router for Phase 4 Multi-LLM Execution (/api/execute)
 * Coordinates Query Understanding -> Intelligence Routing -> Multi-LLM Inference Execution.
 */

import { Router } from 'express';
import { processContext } from '../services/contextManager.js';
import { filterPrivacyContext, filterPrivacy } from '../services/privacyFilter.js';
import { analyzeQuery } from '../services/queryUnderstanding.js';
import { routeTask } from '../services/intelligenceRouter.js';
import { executeLLMWithFallback } from '../services/llmExecution.js';
import { validateQueryInput } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/execute
 * Executes a full end-to-end task pipeline with real LLM inference
 */
router.post('/', async (req, res) => {
  try {
    const { query, context: userContext, strategy = 'balanced', options = {} } = req.body || {};

    // 1. Input Validation
    validateQueryInput(query);

    // 2. Adaptive Context & Privacy Redaction
    const processed = processContext({ query, context: userContext });
    const privacy = filterPrivacyContext(processed.normalizedQuery, processed.processedContext);

    // 3. Query Understanding
    const analysis = analyzeQuery(privacy.redactedQuery);

    // 4. Intelligence Routing Engine Selection
    const routeResult = await routeTask(analysis, strategy);

    if (routeResult.status === 'insufficient_data' || !routeResult.winningCandidate) {
      return res.status(422).json({
        status: 'insufficient_data',
        message: 'No operational model endpoint available with verified metadata for this task.',
        queryAnalysis: analysis,
        routing: routeResult
      });
    }

    const promptText = privacy.redactedQuery;

    // 5. Multi-LLM Execution with Fallback & Real Latency Measurement
    const execResult = await executeLLMWithFallback({
      rankedCandidates: routeResult.rankedCandidates,
      prompt: promptText,
      taskType: analysis.taskType,
      parameters: options.parameters || {}
    });

    if (execResult.status === 'no_compatible_model') {
      return res.status(422).json({
        status: 'no_compatible_model',
        message: execResult.message || 'No compatible model endpoint available for Hugging Face execution.',
        queryAnalysis: analysis,
        routing: routeResult,
        attemptedCandidates: []
      });
    }

    if (execResult.status === 'auth_error') {
      return res.status(401).json({
        status: 'auth_error',
        message: execResult.message || 'Hugging Face API authentication failed.',
        queryAnalysis: analysis,
        routing: routeResult,
        attemptedCandidates: execResult.attemptedCandidates || [],
        lastError: execResult.lastError
      });
    }

    if (execResult.status === 'quota_error') {
      return res.status(402).json({
        status: 'quota_error',
        message: execResult.message || 'Hugging Face API token inference credit quota exceeded (HTTP 402).',
        queryAnalysis: analysis,
        routing: routeResult,
        attemptedCandidates: execResult.attemptedCandidates || [],
        lastError: execResult.lastError
      });
    }

    if (execResult.status !== 'success' || !execResult.execution) {
      return res.status(503).json({
        status: 'provider_execution_error',
        message: execResult.message || 'LLM provider execution failed across all candidate endpoints.',
        queryAnalysis: analysis,
        routing: routeResult,
        attemptedCandidates: execResult.attemptedCandidates || [],
        lastError: execResult.lastError || 'Unknown provider error'
      });
    }

    // 6. Redact Sensitive Patterns in Output
    let finalOutput = execResult.execution.output || '';
    if (finalOutput) {
      const outputPrivacy = filterPrivacy(finalOutput);
      finalOutput = outputPrivacy.redactedQuery;
    }

    return res.status(200).json({
      status: 'success',
      queryAnalysis: analysis,
      privacy: {
        hasRedactions: privacy.hasRedactions,
        redactionCount: privacy.redactionCount
      },
      routing: {
        winningCandidate: routeResult.winningCandidate,
        rankedCandidates: routeResult.rankedCandidates,
        confidence: routeResult.confidence,
        routingStrategy: routeResult.routingStrategy,
        fallbackUsed: execResult.fallbackUsed,
        attemptCount: execResult.attemptCount
      },
      execution: {
        modelId: execResult.execution.modelId,
        provider: execResult.execution.provider,
        taskType: execResult.execution.taskType,
        output: finalOutput || null,
        imageDataUri: execResult.execution.imageDataUri || null,
        realLatencyMs: execResult.execution.realLatencyMs,
        sourceType: execResult.execution.sourceType,
        isSimulated: execResult.execution.sourceType === 'static_fallback',
        simulatedLabel: execResult.execution.sourceType === 'static_fallback' ? 'SIMULATED RESPONSE — Provider unavailable' : null,
        attemptedCandidates: execResult.attemptedCandidates
      }
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred during task execution.'
    });
  }
});

export default router;
