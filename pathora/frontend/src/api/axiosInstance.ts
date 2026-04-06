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
  if (typeof document !== "undefined") {
    // Clear all auth-related cookies
    const cookies = ["access_token", "auth_status", "refresh_token"];
    cookies.forEach((name) => {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    });
  }
  if (typeof window !== "undefined") {
    window.location.href = "/";
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
