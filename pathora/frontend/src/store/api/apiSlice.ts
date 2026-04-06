import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { getCurrentApiLanguage } from "../../api/languageHeader";
import { getCookie } from "../../utils/cookie";

const baseUrl = API_GATEWAY_BASE_URL;

export const prepareApiHeaders = (
  headers: Headers,
  cookieSource?: string | null,
  preferredLanguage?: string | null,
) => {
  const token = getCookie("access_token", cookieSource);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Accept-Language", getCurrentApiLanguage(preferredLanguage));
  return headers;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers) => prepareApiHeaders(headers),
  }),
  tagTypes: ["Products", "Orders", "Customers", "Dashboard", "events", "Auth"],
  endpoints: () => ({}),
});
