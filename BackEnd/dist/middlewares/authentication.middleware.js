"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = verifyUser;
const user_model_1 = require("../models/user.model");
const http_error_1 = require("../utils/http-error");
const http_status_const_1 = require("../const/http-status.const");
const error_message_const_1 = require("../const/error-message.const");
const jwt_token_util_1 = require("../utils/jwt-token.util");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_config_1 = __importDefault(require("../config/redis.config"));
async function verifyUser(req, _res, next) {
    try {
        const accessToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7).trim()
            : null;
        if (!accessToken) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.UNAUTHORIZED);
        }
        const decode = (0, jwt_token_util_1.verifyAccesToken)(accessToken);
        if (!decode?._id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.ACCESS_TOKEN_EXPIRED);
        }
        const userId = decode._id;
        const isBlocked = await redis_config_1.default.get(`blocked:user:${userId}`);
        if (isBlocked) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.LOCKED, error_message_const_1.HttpResponse.USER_BLOCKED);
        }
        const user = await user_model_1.UserModel.findById(userId).select("_id email role isActive");
        if (!user || !user.isActive) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.LOCKED, error_message_const_1.HttpResponse.USER_BLOCKED);
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next((0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.ACCESS_TOKEN_EXPIRED));
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next((0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.UNAUTHORIZED));
        }
        next(error);
    }
}
