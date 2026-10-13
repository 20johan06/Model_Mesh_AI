/**
 * ModelMesh AI Frontend API Client Config & Multi-LLM Execution Client
 * Prioritizes VITE_API_BASE_URL with fallback to http://localhost:3001
 */

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
                 (import.meta.env.VITE_API_URL as string) ||
                 (import.meta.env.VITE_BACKEND_URL as string) ||
                 (import.meta.env.VITE_SERVER_URL as string);

  const rawUrl = (envUrl && envUrl.trim()) ? envUrl.trim() : 'http://localhost:3001';
  let cleanUrl = rawUrl.replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api')) {
    cleanUrl = cleanUrl.slice(0, -4);
  }
  return cleanUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Builds an absolute API URL for a given endpoint path, avoiding duplicate /api path segments.
 * e.g., buildApiUrl('/api/health') -> `${API_BASE_URL}/api/health`
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  if (cleanPath === '/api') {
    return `${API_BASE_URL}/api`;
  }
  return `${API_BASE_URL}/api${cleanPath}`;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface CandidateAttempt {
  modelId: string;
  provider: string;
  attemptNumber: number;
  statusCode?: number;
  errorType?: string;
  error?: string;
}

export interface ExecuteTaskRequest {
  query: string;
  context?: Record<string, unknown>;
  strategy?: 'balanced' | 'cost' | 'latency' | 'quality' | 'custom';
  history?: Array<{ sender: 'user' | 'assistant'; content: string }>;
  options?: {
    parameters?: {
      max_new_tokens?: number;
      temperature?: number;
      top_p?: number;
    };
  };
}

export interface ExecuteTaskResponse {
  status: 'success' | 'auth_error' | 'quota_error' | 'no_compatible_model' | 'provider_execution_error' | 'insufficient_data';
  message?: string;
  queryAnalysis?: {
    taskType: string;
    intent: string;
    complexity: string;
    constraints: Record<string, unknown>;
  };
  privacy?: {
    hasRedactions: boolean;
    redactionCount: number;
  };
  routing?: {
    winningCandidate: {
      modelId: string;
      modelName: string;
      provider: string;
      totalScore: number;
      evidenceCompleteness: string;
    };
    rankedCandidates: Array<{
      modelId: string;
      modelName: string;
      provider: string;
      totalScore: number;
    }>;
    confidence: string;
    routingStrategy: string;
    fallbackUsed?: boolean;
    attemptCount?: number;
  };
  execution?: {
    modelId: string;
    provider: string;
    taskType: string;
    output: string | null;
    imageDataUri: string | null;
    realLatencyMs: number;
    sourceType: string;
    isSimulated?: boolean;
    simulatedLabel?: string | null;
    attemptedCandidates?: CandidateAttempt[];
  };
  attemptedCandidates?: CandidateAttempt[];
  lastError?: string;
}

/**
 * Checks backend health endpoint
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse | null> {
  const healthUrl = buildApiUrl('/api/health');
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[API] Health check failed with status: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[API] Health check failed to connect to ${healthUrl}:`, error);
    return null;
  }
}

/**
 * Executes a live task request via backend multi-LLM execution service
 */
export async function executeTaskApi(payload: ExecuteTaskRequest): Promise<ExecuteTaskResponse> {
  const executeUrl = buildApiUrl('/api/execute');
  try {
    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok && !data.status) {
      return {
        status: 'provider_execution_error',
        message: data.message || `Backend returned HTTP ${response.status}: ${response.statusText}`
      };
    }

    return data;
  } catch (error: any) {
    console.error('[API] Execution request failed:', error);
    const isFailedToFetch = error?.message === 'Failed to fetch' || error?.name === 'TypeError';
    const detailMsg = isFailedToFetch
      ? `Failed to fetch: Unable to connect to backend API at ${API_BASE_URL}. Please verify CORS headers and backend service availability at ${buildApiUrl('/api/health')}.`
      : (error?.message || 'Failed to connect to backend execution service.');
    return {
      status: 'provider_execution_error',
      message: detailMsg
    };
  }
}

/**
 * Generates an image via backend Stability AI endpoint
 */
export async function generateImageApi(prompt: string, options: Record<string, unknown> = {}): Promise<ExecuteTaskResponse> {
  const generateImageUrl = buildApiUrl('/api/generate-image');
  try {
    const response = await fetch(generateImageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ prompt, options }),
    });

    const data = await response.json();
    if (!response.ok && !data.status) {
      return {
        status: 'provider_execution_error',
        message: data.message || `Stability API returned HTTP ${response.status}: ${response.statusText}`
      };
    }

    return data;
  } catch (error: any) {
    console.error('[API] Image generation request failed:', error);
    const isFailedToFetch = error?.message === 'Failed to fetch' || error?.name === 'TypeError';
    const detailMsg = isFailedToFetch
      ? `Failed to fetch: Unable to connect to backend API at ${API_BASE_URL}. Please verify CORS headers and backend service availability at ${buildApiUrl('/api/health')}.`
      : (error?.message || 'Failed to connect to image generation service.');
    return {
      status: 'provider_execution_error',
      message: detailMsg
    };
  }
}

