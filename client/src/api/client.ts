import { Mode, Resource, WorkloadRequest, WorkloadResponse } from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchResources(mode: Mode): Promise<Resource[]> {
  const response = await fetch(`${API_BASE_URL}/api/resources?mode=${mode}`);
  return handleResponse<Resource[]>(response);
}

export async function fetchWorkload(request: WorkloadRequest): Promise<WorkloadResponse> {
  const response = await fetch(`${API_BASE_URL}/api/workload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return handleResponse<WorkloadResponse>(response);
}