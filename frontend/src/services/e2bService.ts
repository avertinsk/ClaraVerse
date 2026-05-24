import { apiClient } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/config';

const API_BASE_URL = getApiBaseUrl();

export interface E2BSettings {
  api_key_set: boolean;
  api_key_masked: string;
}

export interface E2BPlotResult {
  format: string;
  data: string;
}

export interface E2BFileResult {
  filename: string;
  data: string;
  size: number;
}

export interface E2BExecuteResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
  plots: E2BPlotResult[];
  files: E2BFileResult[];
  execution_time: number | null;
  install_output?: string;
}

/**
 * Fetch current E2B settings
 */
export async function fetchE2BSettings(): Promise<E2BSettings> {
  const response = await apiClient.get(`${API_BASE_URL}/api/admin/e2b-settings`, {
    requiresAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch E2B settings: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update E2B API key
 */
export async function updateE2BApiKey(apiKey: string): Promise<void> {
  const response = await apiClient.put(
    `${API_BASE_URL}/api/admin/e2b-settings`,
    { api_key: apiKey },
    { requiresAuth: true }
  );

  if (!response.ok) {
    throw new Error(`Failed to update E2B settings: ${response.statusText}`);
  }
}

/**
 * Execute Python code via the local E2B executor
 */
export async function executePythonCode(
  code: string,
  options?: { timeout?: number; dependencies?: string[] }
): Promise<E2BExecuteResponse> {
  const response = await apiClient.post(
    `${API_BASE_URL}/api/e2b/execute`,
    {
      code,
      timeout: options?.timeout ?? 30,
      dependencies: options?.dependencies ?? [],
    },
    { requiresAuth: true }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Code execution failed');
  }

  return await response.json();
}
