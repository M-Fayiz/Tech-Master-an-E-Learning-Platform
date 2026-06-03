import { IChatBotModel } from "../models/chatbot.model";
import { IChatbotDTO } from "../types/dtos.type/chatbot.dto.type";

export function chatbotDTO(chat: IChatBotModel): IChatbotDTO {
  return {
    _id: chat._id,
    learnerId: chat.learnerId,
    courseId: chat.courseId,
    messages: chat.messages,
  };
}
