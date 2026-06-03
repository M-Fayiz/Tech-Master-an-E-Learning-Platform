import { Response, Request, NextFunction } from "express";
import { IAuthController } from "../interface/IAuthController";
import { IAuthService } from "../../services/interface/IAuthService";
import { HttpStatus } from "../../const/http-status.const";
import { HttpResponse } from "../../const/error-message.const";
import { successResponse } from "../../utils/response.util";
import { createHttpError } from "../../utils/http-error";
import { clearCookies } from "../../utils/clearCookies.util";
import { setAccessToken, setRefreshToken } from "../../utils/cookie.util";
import { IUserModel } from "../../models/user.model";
import { env } from "../../config/env.config";

export class AuthController implements IAuthController {
  constructor(private _authService: IAuthService) {}

  private extractAccessToken(req: Request): string | null {
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

  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await this._authService.signUp(req.body);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { email }));
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = await this._authService.verifyEmail(req.body);
      setAccessToken(res, token.accessToken);
      setRefreshToken(res, token.refreshToken);
      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.LOGGED_IN_SUCCESSFULLY, {
          token: token.accessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async authMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accessToken = this.extractAccessToken(req);

      if (!accessToken) {
        return next(
          createHttpError(HttpStatus.UNAUTHORIZED, HttpResponse.UNAUTHORIZED),
        );
      }

      const user = await this._authService.authMe(accessToken);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { user }));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw createHttpError(
          HttpStatus.FORBIDDEN,
          HttpResponse.REFRESH_TOKEN_EXPIRED,
        );
      }

      const { newAccessToken, payload } =
        await this._authService.refreshAccessToken(refreshToken);

      setAccessToken(res, newAccessToken);
      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.OK, {
          user: payload,
          token: newAccessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const tokensAndUserData = await this._authService.login(email, password);
      setAccessToken(res, tokensAndUserData.accessToken);
      setRefreshToken(res, tokensAndUserData.refreshToken);

      res.status(HttpStatus.OK).json(
        successResponse(HttpResponse.LOGGED_IN_SUCCESSFULLY, {
          token: tokensAndUserData.accessToken,
          user: tokensAndUserData.MappedUser,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearCookies(res);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.LOGGED_OUT, { logout: true }));
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = await this._authService.forgotPassword(req.body.email);
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { email }));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, token, password } = req.body;
      const response = await this._authService.resetPassword(
        email,
        token,
        password,
      );
      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { email: response }));
    } catch (error) {
      next(error);
    }
  }

  async googleAuthRedirection(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(HttpStatus.FORBIDDEN).json(HttpResponse.INVALID_CREDNTIALS);
        return;
      }

      const data = await this._authService.generateToken(
        req.user as IUserModel,
      );

      setAccessToken(res, data.accessToken);
      setRefreshToken(res, data.refreshToken);

      res.redirect(`${env.CLIENT_URL_2}/?token=${data.accessToken}`);
    } catch (error) {
      res.redirect(`${env.CLIENT_ORGIN}/auth/signup`);
      next(error);
    }
  }
}
