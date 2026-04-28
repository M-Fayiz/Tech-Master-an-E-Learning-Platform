import { axiosInstance } from "../axios/createInstance";
import type {
  IDecodedUserType,
  ILogin,
  ISignUp,
  UserRoleType,
} from "../types/auth.types";
import { API } from "../constants/api.constant";

import { throwAxiosError } from "@/utility/throwErrot";
import { ApiError } from "@/utility/apiError.util";
import { sharedService } from "./shared.service";
import { HttpStatusCode } from "@/constants/statusCode";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/store/accessToken.store";

const stripRedirectToken = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("token")) {
    return;
  }

  url.searchParams.delete("token");
  window.history.replaceState({}, document.title, url.toString());
};

const hydrateUserProfile = async (
  user: IDecodedUserType,
): Promise<IDecodedUserType> => {
  if (!user.profile) {
    return user;
  }

  const profileUrl = await sharedService.getPreSignedDownloadURL(user.profile);

  if (!profileUrl) {
    return user;
  }

  return { ...user, profile: profileUrl };
};

export const AuthService = {
  signUp: async (
    data: ISignUp,
  ): Promise<{ status: number; message: string; email: string }> => {
    try {
      const response = await axiosInstance.post(API.Auth.SIGNUP_URL, data);
      return response.data;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  verifyEmail: async (
    email: string | null,
    token: string | null,
  ): Promise<{
    status: number;
    message: string;
    user: IDecodedUserType;
    token?: string;
  }> => {
    try {
      const response = await axiosInstance.post(API.Auth.VERIFY_EMAIL_URL, {
        token,
        email,
      });

      setAccessToken(response.data?.token);
      response.data.user = await hydrateUserProfile(response.data.user);

      return response.data;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  authME: async (): Promise<IDecodedUserType> => {
    try {
      const response = await axiosInstance.post(API.Auth.AUTH_URL, {});
      response.data.user = await hydrateUserProfile(response.data.user);
      return response.data?.user;
    } catch (error) {
      throwAxiosError(error);
    }
  },

  restoreSession: async (): Promise<IDecodedUserType> => {
    try {
      stripRedirectToken();

      if (getAccessToken()) {
        try {
          return await AuthService.authME();
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            error.status !== HttpStatusCode.UNAUTHORIZED
          ) {
            throw error;
          }
        }
      }

      const user = await AuthService.refreshToken();
      if (!user) {
        throw new ApiError("Unauthorized", HttpStatusCode.UNAUTHORIZED);
      }

      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throwAxiosError(error);
    }
  },

  //  axios interseptor
  refreshToken: async (): Promise<IDecodedUserType | null> => {
    try {
      const response = await axiosInstance.get(API.Auth.REFRESH_TOKEN_URL, {
        withCredentials: true,
      });
      setAccessToken(response?.data?.token);
      response.data.user = await hydrateUserProfile(response.data.user);
      return response?.data.user;
    } catch (error) {
      clearAccessToken();
      throwAxiosError(error);
    }
  },
  login: async (
    data: ILogin,
  ): Promise<{
    status: number;
    message: string;
    user: IDecodedUserType;
    token?: string;
  }> => {
    try {
      const response = await axiosInstance.post(API.Auth.LOGIN_URL, data);
      setAccessToken(response?.data?.token);
      response.data.user = await hydrateUserProfile(response.data.user);
      return response?.data;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  logOut: async () => {
    try {
      const response = await axiosInstance.post(
        API.Auth.LOGOUT_URL,
        {},
        { withCredentials: true },
      );
      clearAccessToken();
      if (response.status == HttpStatusCode.OK) return true;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  googleAuth: async (role: UserRoleType): Promise<void> => {
    try {
      window.location.href = `${import.meta.env.VITE_BASE_URL}${API.Auth.GOOGLE_AUTH(role)}`;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  forgotPassword: async (
    email: string,
  ): Promise<{ status: number; message: string; email: string }> => {
    try {
      const response = await axiosInstance.post(API.Auth.FORGOT_PASSWORD_URL, {
        email,
      });
      return response.data?.email;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  resetPassword: async (
    email: string,
    token: string,
    password: string,
  ): Promise<{ status: number; message: string; email: string }> => {
    try {
      const response = await axiosInstance.patch(API.Auth.RESET_PASSWORD_URL, {
        email,
        token,
        password,
      });
      return response?.data;
    } catch (error) {
      throwAxiosError(error);
    }
  },
  clearClientAuth: () => {
    clearAccessToken();
  },
};
