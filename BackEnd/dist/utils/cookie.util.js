"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRefreshToken = void 0;
const auth_const_1 = require("../const/auth.const");
const cookie_config_1 = require("../config/cookie.config");
const env_config_1 = require("../config/env.config");
const duration_util_1 = require("./duration.util");
const refreshTokenMaxAge = (0, duration_util_1.parseDurationToMs)(env_config_1.env.REFRESH_TOKEN_MAX_AGE, 7 * 24 * 60 * 60 * 1000);
const setRefreshToken = (res, token) => {
    res.cookie(auth_const_1.AUTH_TOKEN.REFRESH_TOKEN, token, {
        ...cookie_config_1.cookieOptions,
        maxAge: refreshTokenMaxAge,
    });
};
exports.setRefreshToken = setRefreshToken;
