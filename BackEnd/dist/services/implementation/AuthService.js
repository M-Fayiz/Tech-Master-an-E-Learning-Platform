"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const user_types_1 = require("../../types/user.types");
const bcrypt_util_1 = require("../../utils/bcrypt.util");
const send_mail_util_1 = require("../../utils/send-mail.util");
const uuid_1 = require("uuid");
const redis_config_1 = __importDefault(require("../../config/redis.config"));
const http_status_const_1 = require("../../const/http-status.const");
const error_message_const_1 = require("../../const/error-message.const");
const http_error_1 = require("../../utils/http-error");
const jwt_token_util_1 = require("../../utils/jwt-token.util");
const crypto_util_1 = require("../../utils/crypto.util");
const redisKey_const_1 = require("../../const/redisKey.const");
const user_dto_1 = require("../../dtos/user.dto");
const payload_dto_1 = require("../../dtos/payload.dto");
const logger_config_1 = __importDefault(require("../../config/logger.config"));
const env_config_1 = require("../../config/env.config");
const duration_util_1 = require("../../utils/duration.util");
class AuthService {
    constructor(_userRepo, _sessionRepo) {
        this._userRepo = _userRepo;
        this._sessionRepo = _sessionRepo;
        this.refreshSessionMaxAge = (0, duration_util_1.parseDurationToMs)(env_config_1.env.REFRESH_TOKEN_MAX_AGE, 7 * 24 * 60 * 60 * 1000);
    }
    ensureUserCanAuthenticate(user) {
        if (!user.isActive) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.LOCKED, error_message_const_1.HttpResponse.USER_BLOCKED);
        }
        if (!user.isVerified) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.FORBIDDEN, error_message_const_1.HttpResponse.EMAIL_NOT_VERIFIED);
        }
    }
    buildAccessToken(user) {
        return (0, jwt_token_util_1.generateAccessToken)((0, payload_dto_1.payloadDTO)(user));
    }
    async createSessionTokens(user, clientContext) {
        const rawRefreshToken = (0, crypto_util_1.generateSecureToken)();
        const session = await this._sessionRepo.createSession({
            userId: user._id,
            tokenHash: (0, crypto_util_1.hashSecureToken)(rawRefreshToken),
            userAgent: clientContext?.userAgent,
            ip: clientContext?.ip,
            lastUsedAt: new Date(),
            expiresAt: new Date(Date.now() + this.refreshSessionMaxAge),
        });
        const accessToken = this.buildAccessToken(user);
        return {
            accessToken,
            refreshToken: rawRefreshToken,
            session,
            mappedUser: (0, user_dto_1.userDTO)(user),
        };
    }
    async signUp(user) {
        const isUserExist = await this._userRepo.findUserByEmail(user.email);
        if (isUserExist) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.USER_EXIST);
        }
        user.password = await (0, bcrypt_util_1.hashPassword)(user.password);
        const token = (0, uuid_1.v4)();
        await (0, send_mail_util_1.sendToken)(user.email, token, "verify-email");
        const key = `${redisKey_const_1.redisPrefix.VERIFY_EMAIL}:${token}`;
        const response = await redis_config_1.default.setEx(key, 300, JSON.stringify(user));
        if (!response) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        return user.email;
    }
    async verifyEmail(data, clientContext) {
        const key = `${redisKey_const_1.redisPrefix.VERIFY_EMAIL}:${data.token}`;
        const result = await redis_config_1.default.get(key);
        if (!result) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.USER_CREATION_FAILED);
        }
        const storedData = JSON.parse(result);
        const user = {
            name: storedData.name,
            email: storedData.email,
            phone: storedData.phone,
            password: storedData.password,
            role: storedData.role,
            isActive: true,
            isVerified: true,
            ApprovalStatus: user_types_1.mentorApprovalStatus.PENDING,
            isRequested: false,
        };
        const isExistingUser = await this._userRepo.findUserByEmail(storedData.email);
        if (isExistingUser) {
            await redis_config_1.default.del(key);
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.USER_EXIST);
        }
        const newUser = await this._userRepo.createUser(user);
        await redis_config_1.default.del(key);
        if (!newUser) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.CONFLICT, error_message_const_1.HttpResponse.USER_CREATION_FAILED);
        }
        const sessionTokens = await this.createSessionTokens(newUser, clientContext);
        return {
            accessToken: sessionTokens.accessToken,
            refreshToken: sessionTokens.refreshToken,
            user: sessionTokens.mappedUser,
        };
    }
    async authMe(token) {
        const decode = (0, jwt_token_util_1.verifyAccesToken)(token);
        if (!decode) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.ACCESS_TOKEN_EXPIRED);
        }
        const user = await this._userRepo.findUserByEmail(decode.email);
        if (!user) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        this.ensureUserCanAuthenticate(user);
        return (0, user_dto_1.userDTO)(user);
    }
    async refreshAccessToken(token, clientContext) {
        if (!token) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        const currentSession = await this._sessionRepo.findSessionByTokenHash((0, crypto_util_1.hashSecureToken)(token));
        if (!currentSession) {
            logger_config_1.default.warn("refresh session missing or expired");
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.UNAUTHORIZED, error_message_const_1.HttpResponse.REFRESH_TOKEN_EXPIRED);
        }
        await this._sessionRepo.touchSession(currentSession._id);
        const user = await this._userRepo.findUserById(currentSession.userId);
        if (!user) {
            await this._sessionRepo.revokeSession(currentSession._id);
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        this.ensureUserCanAuthenticate(user);
        const nextSession = await this.createSessionTokens(user, clientContext);
        await this._sessionRepo.revokeSession(currentSession._id, nextSession.session._id);
        return {
            newAccessToken: nextSession.accessToken,
            newRefreshToken: nextSession.refreshToken,
            user: nextSession.mappedUser,
        };
    }
    async login(email, password, clientContext) {
        console.log('email:', email);
        const user = await this._userRepo.findUserByEmail(email);
        console.log('user:', user);
        if (!user) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        this.ensureUserCanAuthenticate(user);
        if (!user.password) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
        }
        const isMatch = await (0, bcrypt_util_1.comparePassword)(password, user.password);
        if (!isMatch) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_CREDNTIALS);
        }
        const sessionTokens = await this.createSessionTokens(user, clientContext);
        return {
            accessToken: sessionTokens.accessToken,
            refreshToken: sessionTokens.refreshToken,
            MappedUser: sessionTokens.mappedUser,
        };
    }
    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }
        const currentSession = await this._sessionRepo.findSessionByTokenHash((0, crypto_util_1.hashSecureToken)(refreshToken));
        if (!currentSession) {
            return;
        }
        await this._sessionRepo.revokeSession(currentSession._id);
    }
    async forgotPassword(email) {
        const isUserExist = await this._userRepo.findUserByEmail(email);
        if (!isUserExist) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.USER_NOT_FOUND);
        }
        const secureToken = (0, crypto_util_1.generateSecureToken)();
        const key = `${redisKey_const_1.redisPrefix.FORGOT_PASSWORD}:${email}`;
        await (0, send_mail_util_1.sendToken)(email, secureToken, "reset-password");
        const response = await redis_config_1.default.setEx(key, 300, secureToken);
        if (!response) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        return email;
    }
    async resetPassword(email, token, password) {
        const key = `${redisKey_const_1.redisPrefix.FORGOT_PASSWORD}:${email}`;
        const storedToken = await redis_config_1.default.get(key);
        if (!storedToken) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.TOKEN_NOT_FOUND);
        }
        if (storedToken !== token) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.FORBIDDEN, error_message_const_1.HttpResponse.UNAUTHORIZED);
        }
        const hashedPassword = await (0, bcrypt_util_1.hashPassword)(password);
        const result = await this._userRepo.updateUserPassword(email, hashedPassword);
        if (!result) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        await this._sessionRepo.revokeUserSessions(result._id);
        await redis_config_1.default.del(key);
        return result.email;
    }
    async generateToken(user) {
        const sessionTokens = await this.createSessionTokens(user, undefined);
        return {
            accessToken: sessionTokens.accessToken,
            refreshToken: sessionTokens.refreshToken,
            user: sessionTokens.mappedUser,
        };
    }
}
exports.AuthService = AuthService;
