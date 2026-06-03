import {
  IUser,
  IAuth,
  IMentor,
  ILearner,
  IAdmin,
  mentorApprovalStatus,
} from "../../types/user.types";
import { IUserRepo } from "../../repository/interface/IUserRepo";
import { hashPassword, comparePassword } from "../../utils/bcrypt.util";
import { sendToken } from "../../utils/send-mail.util";
import { v4 as uuidv4 } from "uuid";
import redisClient from "../../config/redis.config";
import { HttpStatus } from "../../const/http-status.const";
import { HttpResponse } from "../../const/error-message.const";
import { createHttpError } from "../../utils/http-error";
import { generateTokens } from "../../utils/jwt-token.util";
import { IAuthService } from "../interface/IAuthService";
import {
  verifyAccesToken,
  verifyRefreshToken,
} from "../../utils/jwt-token.util";
import { JwtPayload } from "jsonwebtoken";
import { IPayload, IUserModel } from "../../models/user.model";
import { generateSecureToken } from "../../utils/crypto.util";
import { redisPrefix } from "../../const/redisKey.const";
import { userDTO } from "../../dtos/user.dto";
import { IUserDTO } from "../../types/dtos.type/user.dto.types";
import { payloadDTO } from "../../dtos/payload.dto";
import logger from "../../config/logger.config";

export class AuthService implements IAuthService {
  constructor(private _userRepo: IUserRepo) {}

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
  ): Promise<{ accessToken: string; refreshToken: string }> {
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
    const payload = payloadDTO(newUser);

    return generateTokens(payload);
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
    if (!user.isActive) {
      throw createHttpError(HttpStatus.LOCKED, HttpResponse.USER_BLOCKED);
    }

    return userDTO(user);
  }

  async refreshAccessToken(
    token: string,
  ): Promise<{ newAccessToken: string; payload: JwtPayload }> {
    if (!token) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    const decode = verifyRefreshToken(token) as JwtPayload;

    if (!decode) {
      logger.warn("refresh expired");
      throw createHttpError(
        HttpStatus.UNAUTHORIZED,
        HttpResponse.REFRESH_TOKEN_EXPIRED,
      );
    }

    const user = await this._userRepo.findUserByEmail(decode.email);
    if (!user?.isActive) {
      throw createHttpError(HttpStatus.LOCKED, HttpResponse.USER_BLOCKED);
    }

    const payload = payloadDTO(user);

    const { accessToken } = generateTokens(payload);
    const newAccessToken = accessToken;
    return { newAccessToken, payload };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    MappedUser: IUserDTO;
  }> {
    const user = await this._userRepo.findUserByEmail(email);
    if (!user) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.USER_NOT_FOUND);
    }
    if (!user.isActive) {
      throw createHttpError(HttpStatus.FORBIDDEN, HttpResponse.USER_BLOCKED);
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw createHttpError(
        HttpStatus.BAD_REQUEST,
        HttpResponse.INVALID_CREDNTIALS,
      );
    }

    const MappedUser = userDTO(user);
    const { accessToken, refreshToken } = generateTokens(payloadDTO(user));
    return { accessToken, refreshToken, MappedUser };
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
    await redisClient.del(key);
    return result.email;
  }

  async generateToken(user: IUser | IMentor | ILearner | IAdmin): Promise<{
    accessToken: string;
    refreshToken: string;
    payload: JwtPayload;
  }> {
    const payload: IPayload = {
      _id: user._id,
      email: user.email,
      role: user.role,
      ApprovalStatus: user.ApprovalStatus,
    };
    const { accessToken, refreshToken } = generateTokens(payload);
    return { accessToken, refreshToken, payload };
  }
}
