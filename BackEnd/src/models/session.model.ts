import mongoose, { Document, Types } from "mongoose";
import { DbModelName } from "../const/modelName.const";

const AuthSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DbModelName.USER,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DbModelName.AUTH_SESSION,
      default: null,
    },
  },
  { timestamps: true },
);

AuthSessionSchema.index({ userId: 1, revokedAt: 1 });
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface IAuthSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedBy?: Types.ObjectId | null;
}

export interface IAuthSessionModel
  extends Document<Types.ObjectId>,
    Omit<IAuthSession, "_id"> {}

export const AuthSessionModel = mongoose.model<IAuthSessionModel>(
  DbModelName.AUTH_SESSION,
  AuthSessionSchema,
);
