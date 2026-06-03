import { FilterQuery, Types } from "mongoose";
import { ChatModel, IChatModel } from "../../models/chat.model";
import { BaseRepository } from "../baseRepository";
import { IChatRespository } from "../interface/IChatRepository";
import { IChatPopulated } from "../../types/dtos.type/chat.dto.types";

export class ChatRepository
  extends BaseRepository<IChatModel>
  implements IChatRespository
{
  constructor() {
    super(ChatModel);
  }
  async createChat(chatData: Partial<IChatModel>): Promise<IChatModel> {
    return await this.create(chatData);
  }
  async getChat(prticipandtKey: string): Promise<IChatModel | null> {
    return await this.findOne({ participantKey: prticipandtKey });
  }
  async findChatId(chatId: Types.ObjectId): Promise<IChatModel | null> {
    return await this.findById(chatId);
  }
  async updateChat(
    chatId: Types.ObjectId,
    filter: FilterQuery<IChatModel>,
  ): Promise<IChatModel | null> {
    return await this.findByIDAndUpdate(chatId, filter);
  }
  async listUsers(senderId: Types.ObjectId): Promise<IChatPopulated[] | null> {
    const result = await this.find({ users: senderId }, ["users"]);
    return result as unknown as IChatPopulated[];
  }
  async IncrementUnreadMsg(
    chatId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IChatModel | null> {
    return await this.findByIDAndUpdate(chatId, {
      $inc: {
        [`unreadCount.${userId}`]: 1,
      },
    });
  }
  async resetUnreadMsg(
    chatId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IChatModel | null> {
    return await this.findByIDAndUpdate(chatId, {
      $inc: {
        [`unreadCount.${userId}`]: 0,
      },
    });
  }
}
