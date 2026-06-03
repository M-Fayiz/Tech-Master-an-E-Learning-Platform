import { IChatbotDTO } from "../../types/dtos.type/chatbot.dto.type";

export interface IChatbotService {
  createChat(
    learnerId: string,
    courseId: string,
    message: string,
  ): Promise<IChatbotDTO>;
  fetchChat(learnerId: string, courseId: string): Promise<IChatbotDTO>;
}
