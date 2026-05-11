/**
 * Shared admin API request/response types.
 */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminActionRequest {
  user_id?: string;
  id?: string;
  action?: "disable" | "enable";
  role?: "admin" | "member" | "owner";
  status?: "active" | "suspended";
  tier?: "free" | "starter" | "business";
}
