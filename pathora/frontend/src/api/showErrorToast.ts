import { toast } from "react-toastify";
import { toastConfig } from "./axiosInstance";
import i18n from "../i18n/config";

export const showErrorToast = (errorKey: string, details?: string): void => {
  const translationKey = `error_response.${errorKey}`;
  const defaultKey = "error_response.DEFAULT_ERROR";

  const translatedMessage = i18n.exists(translationKey)
    ? i18n.t(translationKey)
    : i18n.t(defaultKey);

  const message = details
    ? `${translatedMessage}: ${details}`
    : translatedMessage;
  toast.error(message, toastConfig);
};
