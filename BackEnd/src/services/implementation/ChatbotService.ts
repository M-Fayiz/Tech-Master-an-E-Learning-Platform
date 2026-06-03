import { Types } from "mongoose";
import { HttpResponse } from "../../const/error-message.const";
import { HttpStatus } from "../../const/http-status.const";
import { chatbotDTO } from "../../dtos/chatbot.dto";
import { IChatbotRepository } from "../../repository/interface/IChatbotRepository";
import { ICourseRepository } from "../../repository/interface/ICourseRepository";
import { IEnrolledRepository } from "../../repository/interface/IEnrolledRepositoy";
import { systemInstruction } from "../../template/systemInstruction.template";
import { Sender } from "../../types/chatBot.type";
import { IChatbotDTO } from "../../types/dtos.type/chatbot.dto.type";
import { askGemini, GeminiMessage } from "../../utils/gemini.util";
import { createHttpError } from "../../utils/http-error";
import { IChatbotService } from "../interface/IChatbotService";
import { parseObjectId } from "../../mongoose/objectId";

export class ChatbotService implements IChatbotService {
  constructor(
    private _chatbotRepository: IChatbotRepository,
    private _enrolledRepository: IEnrolledRepository,
    private _courseRepository: ICourseRepository,
  ) {}

  async createChat(
    learnerId: string,
    courseId: string,
    message: string,
  ): Promise<IChatbotDTO> {
    const course_Id = new Types.ObjectId(courseId);
    const learner_Id = new Types.ObjectId(learnerId);

    const isEnrolled = await this._enrolledRepository.findEnrlloedCourse({
      courseId: course_Id,
      learnerId: learner_Id,
    });

    if (!isEnrolled) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.NOT_ENROLLED);
    }

    const course = await this._courseRepository.getCourse(course_Id);
    console.log(course);
    if (!course) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        HttpResponse.COURSE_NOT_FOUND,
      );
    }

    let chat = await this._chatbotRepository.findChat({ learnerId, courseId });

    if (!chat) {
      chat = await this._chatbotRepository.createChat({
        learnerId: learner_Id,
        courseId: course_Id,
        messages: [],
      });
    }

    chat.messages.push({
      role: Sender.USER,
      content: message,
      createdAt: new Date(),
    });

    const systemInstructionData = systemInstruction(course);

    const contents: GeminiMessage[] = [
      systemInstructionData,
      ...chat.messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    ];

    const aiReply = await askGemini(contents);

    chat.messages.push({
      role: Sender.AI,
      content: aiReply as string,
      createdAt: new Date(),
    });

    const updatedChat = await this._chatbotRepository.updateChatbot(chat._id, {
      $set: { messages: chat.messages },
    });
    if (!updatedChat) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }
    return chatbotDTO(updatedChat);
  }
  async fetchChat(learnerId: string, courseId: string): Promise<IChatbotDTO> {
    const learner_Id = parseObjectId(learnerId);
    const course_Id = parseObjectId(courseId);
    if (!learner_Id || !course_Id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const getChtatbotChats = await this._chatbotRepository.findChat({
      learnerId,
      courseId,
    });
    if (!getChtatbotChats) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }

    return chatbotDTO(getChtatbotChats);
  }
}
