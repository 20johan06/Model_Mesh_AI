/**
 * ModelMesh AI Frontend API Client Config & Multi-LLM Execution Client
 * Reads base URL from VITE_API_URL or defaults to http://localhost:3001
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

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
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
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
    console.warn('[API] Health check request failed:', error);
    return null;
  }
}

/**
 * Executes a live task request via backend multi-LLM execution service
 */
export async function executeTaskApi(payload: ExecuteTaskRequest): Promise<ExecuteTaskResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/execute`, {
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
        message: data.message || `Server returned HTTP ${response.status}: ${response.statusText}`
      };
    }

    return data;
  } catch (error: any) {
    console.error('[API] Execution request failed:', error);
    return {
      status: 'provider_execution_error',
      message: error.message || 'Failed to connect to backend execution service.'
    };
  }
}

/**
 * Generates an image via backend Stability AI endpoint
 */
export async function generateImageApi(prompt: string, options: Record<string, unknown> = {}): Promise<ExecuteTaskResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
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
    return {
      status: 'provider_execution_error',
      message: error.message || 'Failed to connect to image generation service.'
    };
  }
}
