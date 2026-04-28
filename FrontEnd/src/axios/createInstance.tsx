import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import { AuthService } from "../service/auth.service";
import { HttpStatusCode } from "@/constants/statusCode";
import { router } from "@/router/AppRouter";
import { getAccessToken } from "@/store/accessToken.store";

let refreshRequest: Promise<unknown> | null = null;

const createInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_BASE_URL}/api/v1/`,
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as any;

      const requestUrl = originalRequest?.url ?? "";
      const isAuthEndpoint = requestUrl.includes("/auth/");
      const isRefreshRequest = requestUrl.includes("/auth/refresh-token");

      if (
        status === HttpStatusCode.UNAUTHORIZED &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        originalRequest._retry = true;
        try {
          refreshRequest ??= AuthService.refreshToken().finally(() => {
            refreshRequest = null;
          });
          await refreshRequest;
          return instance(originalRequest);
        } catch {
          window.dispatchEvent(new Event("force-logout"));
        }
      }

      if (isAuthEndpoint) {
        return Promise.reject({
          status,
          message: (error.response?.data as any)?.error || "Request failed",
        });
      }

      if (status === HttpStatusCode.FORBIDDEN && !isRefreshRequest) {
        router.navigate("/unauthorized");
        return;
      }

      if (status === HttpStatusCode.LOCKED) {
        router.navigate("/auth/login");
        return;
      }

      return Promise.reject({
        status,
        message: (error.response?.data as any)?.error || "Request failed",
      });
    },
  );

  return instance;
};

export const axiosInstance = createInstance();
