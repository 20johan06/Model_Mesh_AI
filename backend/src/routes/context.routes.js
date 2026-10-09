/**
 * Express router for Adaptive Context Layer (/api/context)
 */

import { Router } from 'express';
import { processContext } from '../services/contextManager.js';
import { filterPrivacyContext } from '../services/privacyFilter.js';
import { analyzeQuery } from '../services/queryUnderstanding.js';
import { ValidationError, PayloadTooLargeError } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/context/analyze
 * Analyzes query, normalizes context, redacts PII/secrets across query and optional context, and extracts query metadata.
 */
router.post('/analyze', (req, res) => {
  try {
    const { query, context: userContext } = req.body || {};

    // Step 1: Context Management (Normalization & Validation)
    const processed = processContext({ query, context: userContext });

    // Step 2: Privacy Filtering across normalized query AND optional context
    const privacyResult = filterPrivacyContext(processed.normalizedQuery, processed.processedContext);

    // Step 3: Query Understanding on the privacy-filtered (redacted) query text
    const queryAnalysis = analyzeQuery(privacyResult.redactedQuery);

    // Structure Safe JSON Response
    return res.status(200).json({
      status: 'success',
      taskType: queryAnalysis.taskType,
      intent: queryAnalysis.intent,
      complexity: queryAnalysis.complexity,
      constraints: queryAnalysis.constraints,
      inputStats: queryAnalysis.inputStats,
      context: {
        processedQuery: privacyResult.redactedQuery,
        userContext: privacyResult.redactedContext,
        metadata: processed.metadata
      },
      privacy: {
        hasRedactions: privacyResult.hasRedactions,
        redactionCount: privacyResult.redactionCount,
        summary: privacyResult.summary
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode || 400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    if (error instanceof PayloadTooLargeError) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: error.message
      });
    }

    // Default error handling for unexpected exceptions (Do not leak stack traces or raw inputs)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the context analysis request.'
    });
  }
});

export default router;
