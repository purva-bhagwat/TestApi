import {
  LoadBalancerConfig,
  LoadBalancerResult,
  LoadTestConfig,
  LoadTestHistoryResponse,
  LoadTestMetricsResponse,
  PaginatedHistoryResponse,
  Project,
  RunComparisonResponse,
  SavedEndpoint,
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

/**
 * Fetch all workspace projects (/api/v1/projects)
 */
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new workspace project (/api/v1/projects)
 */
export async function createProject(data: {
  name: string;
  description?: string;
  base_url?: string;
}): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Failed to create project with status: ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) errorMessage = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get project details with all saved endpoints (/api/v1/projects/{project_id})
 */
export async function getProject(projectId: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project details: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a workspace project (/api/v1/projects/{project_id})
 */
export async function deleteProject(
  projectId: string
): Promise<{ message: string; id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.status}`);
  }

  return response.json();
}

/**
 * Save an endpoint under a project (/api/v1/projects/{project_id}/endpoints)
 */
export async function createSavedEndpoint(
  projectId: string,
  data: {
    name: string;
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<SavedEndpoint> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/endpoints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Failed to save endpoint with status: ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) errorMessage = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a saved endpoint (/api/v1/projects/endpoints/{endpoint_id})
 */
export async function deleteSavedEndpoint(
  endpointId: string
): Promise<{ message: string; id: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/endpoints/${endpointId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete endpoint: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch unified test execution history (/api/v1/history)
 */
export async function getUnifiedHistory(params: {
  page?: number;
  page_size?: number;
  test_type?: string;
  project_id?: string;
  status?: string;
}): Promise<PaginatedHistoryResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.page_size) query.set("page_size", params.page_size.toString());
  if (params.test_type && params.test_type !== "all") query.set("test_type", params.test_type);
  if (params.project_id) query.set("project_id", params.project_id);
  if (params.status && params.status !== "all") query.set("status", params.status);

  const response = await fetch(`${API_BASE_URL}/api/v1/history?${query.toString()}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch history with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Compare two test runs (/api/v1/history/compare)
 */
export async function compareRuns(
  runAId: string,
  runBId: string
): Promise<RunComparisonResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/history/compare?run_a_id=${runAId}&run_b_id=${runBId}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to compare runs: status ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) errorMessage = err.detail;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Build URL to export history dataset (/api/v1/history/export)
 */
export function getExportUrl(params: {
  format: "json" | "csv";
  test_type?: string;
  project_id?: string;
}): string {
  const query = new URLSearchParams();
  query.set("format", params.format);
  if (params.test_type && params.test_type !== "all") query.set("test_type", params.test_type);
  if (params.project_id) query.set("project_id", params.project_id);
  return `${API_BASE_URL}/api/v1/history/export?${query.toString()}`;
}
