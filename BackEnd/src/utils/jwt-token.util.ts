import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.config";

const ACCESS_TOKEN = env.ACCESS_TOKEN as string;

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_TOKEN, { expiresIn: "15m" });
}

export function verifyAccesToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN) as JwtPayload;
}
