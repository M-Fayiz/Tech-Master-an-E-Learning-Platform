import { IUser, IAuth } from "../../types/user.types";
import { IUserDTO } from "../../types/dtos.type/user.dto.types";

export interface IAuthClientContext {
  userAgent?: string;
  ip?: string;
}

export interface IAuthService {
  signUp(user: IUser): Promise<string>;
  verifyEmail(
    data: IAuth,
    clientContext?: IAuthClientContext,
   ): Promise<{ accessToken: string; refreshToken: string; user: IUserDTO }>;
  authMe(token: string): Promise<IUserDTO>;
  refreshAccessToken(
    token: string,
    clientContext?: IAuthClientContext,
  ): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
    user: IUserDTO;
  }>;
  login(
    email: string,
    password: string,
    clientContext?: IAuthClientContext,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    MappedUser: IUserDTO;
  }>;
  logout(refreshToken?: string): Promise<void>;
  forgotPassword(email: string): Promise<string>;
  resetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<string>;
  generateToken(user: IUser): Promise<{
    accessToken: string;
    refreshToken: string;
    user: IUserDTO;
  }>;
}
