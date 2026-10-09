/**
 * ModelMesh AI Frontend API Client Config
 * Reads base URL from VITE_API_URL or defaults to http://localhost:3001
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export interface HealthCheckResponse {
  status: string;
  service: string;
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
