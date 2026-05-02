export interface ApiError {
  code: string;
  message: string;
  details?: string;
  validationErrors?: Record<string, string[]>;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T | null;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
