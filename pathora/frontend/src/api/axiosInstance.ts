import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ToastPosition } from "react-toastify";
import { handleResponseError, waitForRetry } from "./responseInterceptor";
import { showErrorToast } from "./showErrorToast";
import { getCurrentApiLanguage } from "./languageHeader";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { getCookie } from "@/utils/cookie";

const API_BASE_URL: string = API_GATEWAY_BASE_URL;

interface ToastConfig {
  position: ToastPosition;
  autoClose: number;
  hideProgressBar: boolean;
  closeOnClick: boolean;
  pauseOnHover: boolean;
  draggable: boolean;
}

export const toastConfig: ToastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export interface ApiErrorDetail {
  code?: string;
  errorMessage: string;
  details?: string;
}

export interface ApiErrorResponse {
  errors?: ApiErrorDetail[];
  message?: string;
  status?: number;
}

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  baseURL?: string;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const onUnauthorized = (): void => {
  if (typeof window !== "undefined") {
    // Chỉ redirect về home với login modal — KHÔNG xóa cookie/localStorage
    // để user re-login và giữ nguyên context (booking history, etc.)
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = new URL("/", window.location.origin);
    loginUrl.searchParams.set("login", "true");
    loginUrl.searchParams.set("next", currentPath);
    window.location.href = loginUrl.toString();
  }
};

const attachInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getCookie("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers["Accept-Language"] = getCurrentApiLanguage();
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      // --- DEV LOGGER: Bắt và in ra mọi request gửi đi ---
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
        if (config.params && Object.keys(config.params).length > 0) {
          console.log("Params:", config.params);
        }
        
        const parsedData = config.data;
        if (config.data instanceof FormData) {
          const obj: Record<string, any> = {};
          config.data.forEach((value, key) => {
            if (value instanceof File) {
              obj[key] = `[File: ${value.name} (${value.size} bytes)]`;
            } else if (obj[key] !== undefined) {
              if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
              obj[key].push(value);
            } else {
              obj[key] = value;
            }
          });
          console.log("Payload (FormData):", obj);
        } else if (typeof config.data === "string") {
          try {
            console.log("Payload (JSON):", JSON.parse(config.data));
          } catch {
            console.log("Payload (Raw String):", config.data);
          }
        } else if (config.data) {
          console.log("Payload (Object):", config.data);
        } else {
          console.log("Payload: (Empty)");
        }
        console.groupEnd();
      }
      // ----------------------------------------------------

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      // --- DEV LOGGER: Bắt payload gửi đi khi API lỗi ---
      try {
        if (process.env.NODE_ENV === "development" && error.config) {
          const { url, data, params } = error.config;
          let parsedData: any = data;

          // Nếu là FormData, phân tích thành object để dễ xem
          if (data instanceof FormData) {
            parsedData = {};
            data.forEach((value, key) => {
              if (value instanceof File) {
                parsedData[key] = `[File: ${value.name} (${value.size} bytes)]`;
              } else {
                if (parsedData[key] !== undefined) {
                  if (!Array.isArray(parsedData[key])) {
                    parsedData[key] = [parsedData[key]];
                  }
                  parsedData[key].push(value);
                } else {
                  parsedData[key] = value;
                }
              }
            });
          } else if (typeof data === "string") {
            try {
              parsedData = JSON.parse(data);
            } catch (e) {
              // Bỏ qua nếu parse JSON lỗi
            }
          }

          // Ghép thêm query params (thường có ở GET requests) vào payload để xem cho rõ
          if (params && Object.keys(params).length > 0) {
            parsedData = parsedData ? { _body: parsedData, _queryParams: params } : params;
          }

          // Bắn dữ liệu về API Route cục bộ để in ra Terminal
          fetch("/api/dev-logger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: error.config.method?.toUpperCase(), url, payload: parsedData }),
          }).catch(() => {});
        }
      } catch (e) {
        // Chặn lỗi phát sinh từ logger để không ảnh hưởng luồng chính
      }
      // ----------------------------------------------------

      return handleResponseError(error, {
        request: (config) => {
          return instance.request(config);
        },
        wait: waitForRetry,
        showError: (key, details) => {
          showErrorToast(key, details);
        },
        onUnauthorized,
      });
    },
  );
};

attachInterceptors(axiosInstance);

const createCustomInstance = (baseURL: string): AxiosInstance => {
  const customInstance = axios.create({
    ...axiosInstance.defaults,
    baseURL,
  });

  attachInterceptors(customInstance);

  return customInstance;
};

interface ApiHelper {
  get: <T = unknown>(
    url: string,
    config?: CustomAxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>;
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: CustomAxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>;
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: CustomAxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>;
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: CustomAxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>;
  delete: <T = unknown>(
    url: string,
    config?: CustomAxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>;
}

export const api: ApiHelper = {
  get: <T = unknown>(
    url: string,
    config: CustomAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => {
    if (config.baseURL) {
      const customInstance = createCustomInstance(config.baseURL);
      return customInstance.get<T>(url, { ...config, baseURL: undefined });
    }
    return axiosInstance.get<T>(url, config);
  },
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config: CustomAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => {
    if (config.baseURL) {
      const customInstance = createCustomInstance(config.baseURL);
      return customInstance.post<T>(url, data, {
        ...config,
        baseURL: undefined,
      });
    }
    return axiosInstance.post<T>(url, data, config);
  },
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config: CustomAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => {
    if (config.baseURL) {
      const customInstance = createCustomInstance(config.baseURL);
      return customInstance.put<T>(url, data, {
        ...config,
        baseURL: undefined,
      });
    }
    return axiosInstance.put<T>(url, data, config);
  },
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config: CustomAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => {
    if (config.baseURL) {
      const customInstance = createCustomInstance(config.baseURL);
      return customInstance.patch<T>(url, data, {
        ...config,
        baseURL: undefined,
      });
    }
    return axiosInstance.patch<T>(url, data, config);
  },
  delete: <T = unknown>(
    url: string,
    config: CustomAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => {
    if (config.baseURL) {
      const customInstance = createCustomInstance(config.baseURL);
      return customInstance.delete<T>(url, { ...config, baseURL: undefined });
    }
    return axiosInstance.delete<T>(url, config);
  },
};

export default axiosInstance;
