import {
  LoadBalancerConfig,
  LoadBalancerResult,
  LoadTestConfig,
  LoadTestHistoryResponse,
  LoadTestMetricsResponse,
  SingleTestRequest,
  SingleTestResponse,
  TestHistoryResponse,
} from "@/types/api";

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

/**
 * Fetch historical test runs from FastAPI backend (/api/v1/test/history)
 */
export async function getTestHistory(
  limit: number = 20,
  offset: number = 0
): Promise<TestHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/test/history?limit=${limit}&offset=${offset}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch test history with status: ${response.status}`
    );
  }

  const rawData = await response.json();
  const items = Array.isArray(rawData) ? rawData : (rawData?.items || []);
  const total = typeof rawData?.total === "number" ? rawData.total : items.length;

  return { items, total };
}

/**
 * Clear all test history records (/api/v1/test/history)
 */
export async function clearTestHistory(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/test/history`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to clear test history with status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Start a concurrent load test via FastAPI backend (/api/v1/load-test/start)
 */
export async function startLoadTest(
  config: LoadTestConfig
): Promise<LoadTestMetricsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/load-test/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = `Load test failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch historical load test sessions from FastAPI backend (/api/v1/load-test/history)
 */
export async function getLoadTestHistory(
  limit: number = 20,
  offset: number = 0
): Promise<LoadTestHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/load-test/history?limit=${limit}&offset=${offset}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch load test history with status: ${response.status}`
    );
  }

  const rawData = await response.json();
  const items = Array.isArray(rawData) ? rawData : (rawData?.items || []);
  const total = typeof rawData?.total === "number" ? rawData.total : items.length;

  return { items, total };
}

/**
 * Dispatch load-balanced simulation batch via FastAPI backend (/api/v1/load-balancer/simulate)
 */
export async function simulateLoadBalancer(
  config: LoadBalancerConfig
): Promise<LoadBalancerResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/load-balancer/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = `Load balancer simulation failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
