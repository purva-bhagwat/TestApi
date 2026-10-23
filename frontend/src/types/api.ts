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
