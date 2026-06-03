import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { IChatBotModel } from "../../models/chatbot.model";
import { IChatBot } from "../../types/chatBot.type";

export interface IChatbotRepository {
  createChat(chatData: IChatBot): Promise<IChatBotModel>;
  findChat(filter: FilterQuery<IChatBotModel>): Promise<IChatBotModel | null>;
  updateChatbot(
    chatId: Types.ObjectId,
    updateDate: UpdateQuery<IChatBotModel>,
  ): Promise<IChatBotModel | null>;
}
