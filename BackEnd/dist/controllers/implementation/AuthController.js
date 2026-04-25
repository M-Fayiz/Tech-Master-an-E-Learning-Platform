"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_const_1 = require("../../const/http-status.const");
const error_message_const_1 = require("../../const/error-message.const");
const response_util_1 = require("../../utils/response.util");
const http_error_1 = require("../../utils/http-error");
const clearCookies_util_1 = require("../../utils/clearCookies.util");
const cookie_util_1 = require("../../utils/cookie.util");
const env_config_1 = require("../../config/env.config");
class AuthController {
    constructor(_authService) {
        this._authService = _authService;
    }
    getClientContext(req) {
        const forwardedFor = req.headers["x-forwarded-for"];
        const ipAddress = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : forwardedFor?.split(",")[0]?.trim() ?? req.ip;
        return {
            ip: ipAddress,
            userAgent: req.get("user-agent") ?? undefined,
        };
    }
    extractAccessToken(req) {
        const cookieToken = req.cookies?.accessToken;
        if (cookieToken) {
            return cookieToken;
        }
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader?.startsWith("Bearer ")) {
            return authorizationHeader.slice(7).trim();
        }
        return null;
    }
    async signUp(req, res, next) {
        try {
            const email = await this._authService.signUp(req.body);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { email }));
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const token = await this._authService.verifyEmail(req.body, this.getClientContext(req));
            (0, cookie_util_1.setAccessToken)(res, token.accessToken);
            (0, cookie_util_1.setRefreshToken)(res, token.refreshToken);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.LOGGED_IN_SUCCESSFULLY, {
                token: token.accessToken,
                user: token.user,
            }));
        }
        catch (error) {
            next(error);
        }
    }
    async authMe(req, res, next) {
        try {
            const accessToken = this.extractAccessToken(req);
            if (!accessToken) {
                return next((0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.UNAUTHORIZED));
            }
            const user = await this._authService.authMe(accessToken);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { user }));
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.REFRESH_TOKEN_EXPIRED);
            }
            const { newAccessToken, newRefreshToken, user } = await this._authService.refreshAccessToken(refreshToken, this.getClientContext(req));
            (0, cookie_util_1.setAccessToken)(res, newAccessToken);
            (0, cookie_util_1.setRefreshToken)(res, newRefreshToken);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, {
                user,
                token: newAccessToken,
            }));
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const tokensAndUserData = await this._authService.login(email, password, this.getClientContext(req));
            (0, cookie_util_1.setAccessToken)(res, tokensAndUserData.accessToken);
            (0, cookie_util_1.setRefreshToken)(res, tokensAndUserData.refreshToken);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.LOGGED_IN_SUCCESSFULLY, {
                token: tokensAndUserData.accessToken,
                user: tokensAndUserData.MappedUser,
            }));
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            await this._authService.logout(req.cookies?.refreshToken);
            (0, clearCookies_util_1.clearCookies)(res);
            res
                .status(http_status_const_1.HttpStatus.OK)
                .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.LOGGED_OUT, { logout: true }));
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const email = await this._authService.forgotPassword(req.body.email);
            res.status(http_status_const_1.HttpStatus.OK).json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { email }));
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { email, token, password } = req.body;
            const response = await this._authService.resetPassword(email, token, password);
            res
                .status(http_status_const_1.HttpStatus.OK)
                .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { email: response }));
        }
        catch (error) {
            next(error);
        }
    }
    async googleAuthRedirection(req, res, next) {
        try {
            if (!req.user) {
                res.status(http_status_const_1.HttpStatus.FORBIDDEN).json(error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
                return;
            }
            const data = await this._authService.generateToken(req.user);
            (0, cookie_util_1.setAccessToken)(res, data.accessToken);
            (0, cookie_util_1.setRefreshToken)(res, data.refreshToken);
            res.redirect(`${env_config_1.env.CLIENT_URL_2}/?token=${data.accessToken}`);
        }
        catch (error) {
            res.redirect(`${env_config_1.env.CLIENT_ORGIN}/auth/signup`);
            next(error);
        }
    }
}
exports.AuthController = AuthController;
