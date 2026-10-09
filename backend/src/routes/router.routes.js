/**
 * Express router for Intelligence Router (/api/router)
 */

import { Router } from 'express';
import { discoverModels } from '../services/modelDiscovery.js';
import { routeTask } from '../services/intelligenceRouter.js';
import { processContext } from '../services/contextManager.js';
import { filterPrivacyContext } from '../services/privacyFilter.js';
import { analyzeQuery } from '../services/queryUnderstanding.js';

const router = Router();

/**
 * GET /api/router/models
 * Returns list of operational LLMs discovered via Hugging Face API & Verified Provider Specs
 */
router.get('/models', async (req, res) => {
  try {
    const models = await discoverModels();
    return res.status(200).json({
      status: 'success',
      count: models.length,
      models
    });
  } catch (error) {
    console.warn('[ModelDiscovery] Discovery endpoint error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to discover model endpoints.'
    });
  }
});

/**
 * POST /api/router/route
 * Analyzes query via Phase 2 context pipeline and ranks real models via Phase 3 Intelligence Router
 */
router.post('/route', async (req, res) => {
  try {
    const { query, context: userContext, strategy = 'balanced' } = req.body || {};

    // Phase 2 Pipeline: Context -> Privacy -> Understanding
    const processed = processContext({ query, context: userContext });
    const privacy = filterPrivacyContext(processed.normalizedQuery, processed.processedContext);
    const analysis = analyzeQuery(privacy.redactedQuery);

    // Phase 3 Router: Rank models using verified signals
    const routeResult = await routeTask(analysis, strategy);

    return res.status(200).json({
      status: routeResult.status,
      queryAnalysis: analysis,
      privacy: {
        hasRedactions: privacy.hasRedactions,
        redactionCount: privacy.redactionCount
      },
      routing: routeResult
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An error occurred during task routing.'
    });
  }
});

export default router;
