import { Types } from "mongoose";
import {
  AuthSessionModel,
  IAuthSession,
  IAuthSessionModel,
} from "../../models/session.model";
import { BaseRepository } from "../baseRepository";
import { ISessionRepository } from "../interface/ISessionRepository";

export class SessionRepository
  extends BaseRepository<IAuthSessionModel>
  implements ISessionRepository
{
  constructor() {
    super(AuthSessionModel);
  }

  async createSession(
    sessionData: Partial<IAuthSession>,
  ): Promise<IAuthSessionModel> {
    return this.create(sessionData as Partial<IAuthSessionModel>);
  }

  async findSessionByTokenHash(
    tokenHash: string,
  ): Promise<IAuthSessionModel | null> {
    return this.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  async findActiveSessionById(
    sessionId: Types.ObjectId,
  ): Promise<IAuthSessionModel | null> {
    return this.findOne({
      _id: sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  async touchSession(
    sessionId: Types.ObjectId,
    lastUsedAt: Date = new Date(),
  ): Promise<IAuthSessionModel | null> {
    return this.findByIDAndUpdate(sessionId, { lastUsedAt });
  }

  async revokeSession(
    sessionId: Types.ObjectId,
    replacedBy: Types.ObjectId | null = null,
  ): Promise<IAuthSessionModel | null> {
    return this.findByIDAndUpdate(sessionId, {
      revokedAt: new Date(),
      replacedBy,
    });
  }

  async revokeUserSessions(userId: Types.ObjectId): Promise<number> {
    const result = await this.model.updateMany(
      {
        userId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      },
    );

    return result.modifiedCount;
  }
}
