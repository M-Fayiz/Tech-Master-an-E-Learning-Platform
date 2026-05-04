import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { createHttpError } from "../utils/http-error";
import { HttpStatus } from "../const/http-status.const";
import { HttpResponse } from "../const/error-message.const";
import { verifyAccesToken } from "../utils/jwt-token.util";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.config";

export async function verifyUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : null;

    if (!accessToken) {
      throw createHttpError(HttpStatus.UNAUTHORIZED, HttpResponse.UNAUTHORIZED);
    }

    const decode = verifyAccesToken(accessToken);
    if (!decode?._id) {
      throw createHttpError(
        HttpStatus.UNAUTHORIZED,
        HttpResponse.ACCESS_TOKEN_EXPIRED,
      );
    }

    const userId = decode._id;
    const isBlocked = await redisClient.get(`blocked:user:${userId}`);
    if (isBlocked) {
      throw createHttpError(HttpStatus.LOCKED, HttpResponse.USER_BLOCKED);
    }

    const user = await UserModel.findById(userId).select(
      "_id email role isActive",
    );

    if (!user || !user.isActive) {
      throw createHttpError(HttpStatus.LOCKED, HttpResponse.USER_BLOCKED);
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        createHttpError(
          HttpStatus.UNAUTHORIZED,
          HttpResponse.ACCESS_TOKEN_EXPIRED,
        ),
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        createHttpError(HttpStatus.UNAUTHORIZED, HttpResponse.UNAUTHORIZED),
      );
    }

    next(error);
  }
}
