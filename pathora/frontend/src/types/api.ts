export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

/** Executor/Result pattern — NOT the same as ApiResponse in types/home.ts (backend wrapper) */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T | null;
  error?: ApiError;
}

/** @deprecated Use ServiceResponse<T> — renamed to avoid conflict with types/home.ts ApiResponse<T> */
export type ApiResponse<T> = ServiceResponse<T>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
