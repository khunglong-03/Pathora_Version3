import type { AxiosResponse } from "axios";

import type { ServiceResponse } from "@/types/api";
import { extractData, handleApiError } from "@/utils/apiResponse";

type RequestExecutor = () => Promise<AxiosResponse<unknown>>;

export const executeApiRequest = async <T>(
  executor: RequestExecutor,
): Promise<ServiceResponse<T>> => {
  try {
    const response = await executor();
    return {
      success: true,
      data: extractData<T>(response.data),
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
};
