import axios from "axios";
import { tokenStorage } from "../services/tokenStorage";

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.endsWith("/")
      ? configuredBaseUrl
      : `${configuredBaseUrl}/`;
  }

  if (
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/`;
  }

  return `${window.location.origin}/api/`;
}

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

function normalizeApiError(error) {
  const data = error.response?.data;
  let message = "Something went wrong. Please try again.";

  if (!error.response) {
    message =
      "Unable to reach the server. Check that the Django API is running.";
  } else if (typeof data?.detail === "string") {
    message = data.detail;
  } else if (typeof data === "string") {
    message = data;
  } else if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    message = Array.isArray(firstValue) ? firstValue[0] : String(firstValue);
  }

  error.userMessage = message;
  error.status = error.response?.status ?? 0;
  return error;
}

api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = tokenStorage.getRefreshToken();
    const isAuthEndpoint =
      originalRequest?.url?.includes("accounts/login/") ||
      originalRequest?.url?.includes("accounts/refresh/");

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}accounts/refresh/`, { refresh: refreshToken })
            .then(({ data }) => {
              tokenStorage.setTokens({
                access: data.access,
                refresh: data.refresh,
              });
              return data.access;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenStorage.clearTokens();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    const normalizedError = normalizeApiError(error);
    if (normalizedError.status >= 500 || normalizedError.status === 0) {
      window.dispatchEvent(
        new CustomEvent("api:error", { detail: normalizedError.userMessage }),
      );
    }
    return Promise.reject(normalizedError);
  },
);

export function getApiErrorMessage(error) {
  return error?.userMessage || "Something went wrong. Please try again.";
}

export default api;
