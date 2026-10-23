import { SingleTestRequest, SingleTestResponse } from "@/types/api";

export interface HealthCheckResponse {
  status: string;
  app: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch health status from FastAPI backend (/api/v1/health)
 */
export async function getHealthStatus(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API health check failed with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Dispatch a single test request through the FastAPI backend (/api/v1/test/single)
 */
export async function executeSingleTest(
  payload: SingleTestRequest
): Promise<SingleTestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/test/single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback to text status
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
