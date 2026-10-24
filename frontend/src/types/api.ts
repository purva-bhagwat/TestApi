export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface SingleTestRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  query_params?: Record<string, string>;
  body?: string | object;
  timeout_seconds?: number;
}

export interface SingleTestResponse {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, any>;
  query_params?: Record<string, any>;
  body?: string;
  status_code?: number;
  response_time_ms?: number;
  response_headers?: Record<string, any>;
  response_body?: string;
  error_message?: string;
  created_at: string;
}

export interface TestHistoryResponse {
  items: SingleTestResponse[];
  total: number;
}

export interface LoadTestConfig {
  url: string;
  method: string;
  concurrent_users: number;
  total_requests: number;
  timeout_seconds: number;
  headers?: Record<string, string>;
  body?: any;
}

export interface LoadTestMetricsResponse {
  id: string;
  url: string;
  method: string;
  status: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  rps: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  p50_latency_ms: number;
  p90_latency_ms: number;
  p99_latency_ms: number;
  status_code_distribution: Record<string, number>;
  created_at: string;
}

export interface LoadTestHistoryResponse {
  items: LoadTestMetricsResponse[];
  total: number;
}

export interface UpstreamServer {
  url: string;
  weight: number;
  is_healthy: boolean;
}

export interface LoadBalancerConfig {
  servers: UpstreamServer[];
  algorithm: "round_robin" | "weighted_round_robin" | "least_connections";
  concurrent_users: number;
  total_requests: number;
  timeout_seconds: number;
}

export interface ServerMetrics {
  url: string;
  total_dispatched: number;
  success_count: number;
  failure_count: number;
  avg_latency_ms: number;
}

export interface LoadBalancerResult {
  algorithm: string;
  total_requests: number;
  total_duration_seconds: number;
  overall_rps: number;
  server_distribution: Record<string, ServerMetrics>;
}
