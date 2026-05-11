import { Response } from "express";
import { AUTH_TOKEN } from "../const/auth.const";
import { cookieOptions } from "../config/cookie.config";
import { env } from "../config/env.config";
import { parseDurationToMs } from "./duration.util";

const refreshTokenMaxAge =
  parseDurationToMs(env.REFRESH_TOKEN_MAX_AGE, 7 * 24 * 60 * 60 * 1000);

export const setRefreshToken = (res: Response, token: string) => {
  res.cookie(AUTH_TOKEN.REFRESH_TOKEN, token, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAge,
  });
};
