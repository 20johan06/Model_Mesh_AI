import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contextRoutes from './routes/context.routes.js';
import routerRoutes from './routes/router.routes.js';
import executionRoutes from './routes/execution.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

// Basic Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Dynamic CORS configuration supporting deployed Render frontends and local dev
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    // Allow origins explicitly listed in CORS_ORIGIN env var
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow Render deployment subdomains (*.onrender.com)
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('.onrender.com') || hostname === 'onrender.com') {
        return callback(null, true);
      }
    } catch {
      // Invalid URL format
    }

    // Allow local development origins (localhost or 127.0.0.1 on any port)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON request body parser with error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      if (buf.length) JSON.parse(buf.toString(encoding || 'utf8'));
    } catch {
      // Flag syntax error for custom JSON error handler
      req.invalidJson = true;
    }
  }
}));

// Handle Invalid JSON Syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err || req.invalidJson) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON format in request body.'
    });
  }
  next(err);
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'modelmesh-ai-backend'
  });
});

// Mount Adaptive Context Layer Routes
app.use('/api/context', contextRoutes);

// Mount Intelligence Router Routes
app.use('/api/router', routerRoutes);

// Mount Multi-LLM Execution Routes & Image Generation
app.use('/api/execute', executionRoutes);
app.use('/api/generate-image', executionRoutes);

// Handle unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route ${req.originalUrl} not found`
  });
});

// Fallback for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`ModelMesh AI Backend running on http://localhost:${PORT}`);
});
