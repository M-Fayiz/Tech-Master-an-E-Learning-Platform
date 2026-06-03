import {
  IUser,
  IAuth,
  IMentor,
  ILearner,
  IAdmin,
  mentorApprovalStatus,
} from "../../types/user.types";
import { IUserRepo } from "../../repository/interface/IUserRepo";
import { ISessionRepository } from "../../repository/interface/ISessionRepository";
import { hashPassword, comparePassword } from "../../utils/bcrypt.util";
import { sendToken } from "../../utils/send-mail.util";
import { v4 as uuidv4 } from "uuid";
import redisClient from "../../config/redis.config";
import { HttpStatus } from "../../const/http-status.const";
import { HttpResponse } from "../../const/error-message.const";
import { createHttpError } from "../../utils/http-error";
import { generateAccessToken, verifyAccesToken } from "../../utils/jwt-token.util";
import {
  IAuthClientContext,
  IAuthService,
} from "../interface/IAuthService";
import { IPayload, IUserModel } from "../../models/user.model";
import { generateSecureToken, hashSecureToken } from "../../utils/crypto.util";
import { redisPrefix } from "../../const/redisKey.const";
import { userDTO } from "../../dtos/user.dto";
import { IUserDTO } from "../../types/dtos.type/user.dto.types";
import { payloadDTO } from "../../dtos/payload.dto";
import logger from "../../config/logger.config";
import { Types } from "mongoose";
import { env } from "../../config/env.config";
import { parseDurationToMs } from "../../utils/duration.util";

export class AuthService implements IAuthService {
  private readonly refreshSessionMaxAge =
    parseDurationToMs(env.REFRESH_TOKEN_MAX_AGE, 7 * 24 * 60 * 60 * 1000);

  constructor(
    private _userRepo: IUserRepo,
    private _sessionRepo: ISessionRepository,
  ) {}

  private ensureUserCanAuthenticate(user: IUserModel | IMentor | ILearner | IAdmin) {
    if (!user.isActive) {
      throw createHttpError(HttpStatus.LOCKED, HttpResponse.USER_BLOCKED);
    }

    if (!user.isVerified) {
      throw createHttpError(HttpStatus.FORBIDDEN, HttpResponse.EMAIL_NOT_VERIFIED);
    }
  }

  private buildAccessToken(user: IUserModel | IMentor | ILearner | IAdmin) {
    return generateAccessToken(payloadDTO(user));
  }

  private async createSessionTokens(
    user: IUserModel | IMentor | ILearner | IAdmin,
    clientContext?: IAuthClientContext,
  ) {
    const rawRefreshToken = generateSecureToken();
    const session = await this._sessionRepo.createSession({
      userId: user._id as Types.ObjectId,
      tokenHash: hashSecureToken(rawRefreshToken),
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
      mappedUser: userDTO(user),
    };
  }

  async signUp(user: IUser): Promise<string> {
    const isUserExist = await this._userRepo.findUserByEmail(user.email);
    if (isUserExist) {
      throw createHttpError(HttpStatus.CONFLICT, HttpResponse.USER_EXIST);
    }
    user.password = await hashPassword(user.password as string);

    const token = uuidv4();

    await sendToken(user.email, token, "verify-email");

    const key = `${redisPrefix.VERIFY_EMAIL}:${token}`;

    const response = await redisClient.setEx(key, 300, JSON.stringify(user));

    if (!response) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }

    return user.email;
  }
  async verifyEmail(
    data: IAuth,
    clientContext?: IAuthClientContext,
  ): Promise<{ accessToken: string; refreshToken: string; user: IUserDTO }> {
    const key = `${redisPrefix.VERIFY_EMAIL}:${data.token}`;
    const result = await redisClient.get(key);

    if (!result) {
      throw createHttpError(
        HttpStatus.UNAUTHORIZED,
        HttpResponse.USER_CREATION_FAILED,
      );
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
      ApprovalStatus: mentorApprovalStatus.PENDING,
      isRequested: false,
    };

    const isExistingUser = await this._userRepo.findUserByEmail(
      storedData.email,
    );
    if (isExistingUser) {
      await redisClient.del(key);
      throw createHttpError(HttpStatus.CONFLICT, HttpResponse.USER_EXIST);
    }

    const newUser = await this._userRepo.createUser(user as IUserModel);
    await redisClient.del(key);

    if (!newUser) {
      throw createHttpError(
        HttpStatus.CONFLICT,
        HttpResponse.USER_CREATION_FAILED,
      );
    }
    const sessionTokens = await this.createSessionTokens(newUser, clientContext);

    return {
      accessToken: sessionTokens.accessToken,
      refreshToken: sessionTokens.refreshToken,
      user: sessionTokens.mappedUser,
    };
  }

  async authMe(token: string): Promise<IUserDTO> {
    const decode = verifyAccesToken(token);

    if (!decode) {
      throw createHttpError(
        HttpStatus.UNAUTHORIZED,
        HttpResponse.ACCESS_TOKEN_EXPIRED,
      );
    }

    const user = await this._userRepo.findUserByEmail(decode.email);

    if (!user) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    this.ensureUserCanAuthenticate(user);

    return userDTO(user);
  }

  async refreshAccessToken(
    token: string,
    clientContext?: IAuthClientContext,
  ): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
    user: IUserDTO;
  }> {
    if (!token) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    const currentSession = await this._sessionRepo.findSessionByTokenHash(
      hashSecureToken(token),
    );

    if (!currentSession) {
      logger.warn("refresh session missing or expired");
      throw createHttpError(
        HttpStatus.UNAUTHORIZED,
        HttpResponse.REFRESH_TOKEN_EXPIRED,
      );
    }

    await this._sessionRepo.touchSession(currentSession._id);

    const user = await this._userRepo.findUserById(currentSession.userId);
    if (!user) {
      await this._sessionRepo.revokeSession(currentSession._id);
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    this.ensureUserCanAuthenticate(user);

    const nextSession = await this.createSessionTokens(user, clientContext);
    await this._sessionRepo.revokeSession(
      currentSession._id,
      nextSession.session._id,
    );

    return {
      newAccessToken: nextSession.accessToken,
      newRefreshToken: nextSession.refreshToken,
      user: nextSession.mappedUser,
    };
  }

  async login(
    email: string,
    password: string,
    clientContext?: IAuthClientContext,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    MappedUser: IUserDTO;
  }> {
    console.log('email:',email)
    const user = await this._userRepo.findUserByEmail(email);
    console.log('user:',user)
    if (!user) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    this.ensureUserCanAuthenticate(user);

    if (!user.password) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const sessionTokens = await this.createSessionTokens(user, clientContext);
    return {
      accessToken: sessionTokens.accessToken,
      refreshToken: sessionTokens.refreshToken,
      MappedUser: sessionTokens.mappedUser,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const currentSession = await this._sessionRepo.findSessionByTokenHash(
      hashSecureToken(refreshToken),
    );

    if (!currentSession) {
      return;
    }

    await this._sessionRepo.revokeSession(currentSession._id);
  }

  async forgotPassword(email: string): Promise<string> {
    const isUserExist = await this._userRepo.findUserByEmail(email);

    if (!isUserExist) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }

    const secureToken = generateSecureToken();
    const key = `${redisPrefix.FORGOT_PASSWORD}:${email}`;

    await sendToken(email, secureToken, "reset-password");
    const response = await redisClient.setEx(key, 300, secureToken);

    if (!response) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }

    return email;
  }
  async resetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<string> {
    const key = `${redisPrefix.FORGOT_PASSWORD}:${email}`;

    const storedToken = await redisClient.get(key);
    if (!storedToken) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.TOKEN_NOT_FOUND,
      );
    }

    if (storedToken !== token) {
      throw createHttpError(HttpStatus.FORBIDDEN, HttpResponse.UNAUTHORIZED);
    }

    const hashedPassword = await hashPassword(password as string);

    const result = await this._userRepo.updateUserPassword(
      email,
      hashedPassword,
    );

    if (!result) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }
    await this._sessionRepo.revokeUserSessions(result._id as Types.ObjectId);
    await redisClient.del(key);
    return result.email;
  }

  async generateToken(user: IUser | IMentor | ILearner | IAdmin): Promise<{
    accessToken: string;
    refreshToken: string;
    user: IUserDTO;
  }> {
    const sessionTokens = await this.createSessionTokens(
      user as IUserModel,
      undefined,
    );

    return {
      accessToken: sessionTokens.accessToken,
      refreshToken: sessionTokens.refreshToken,
      user: sessionTokens.mappedUser,
    };
  }
}
