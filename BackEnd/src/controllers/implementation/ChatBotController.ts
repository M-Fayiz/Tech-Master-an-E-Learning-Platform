import { Request, Response, NextFunction } from "express";
import { IChatbotController } from "../interface/IChatBotController";
import { IChatbotService } from "../../services/interface/IChatbotService";
import { HttpStatus } from "../../const/http-status.const";
import { successResponse } from "../../utils/response.util";
import { HttpResponse } from "../../const/error-message.const";

export class ChatbotController implements IChatbotController {
  constructor(private _chatbotService: IChatbotService) {}

  chat = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { learnerId, courseId, message } = req.body;
      console.log("message :", message);
      const createdChat = await this._chatbotService.createChat(
        learnerId,
        courseId,
        message,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { createdChat }));
    } catch (error) {
      next(error);
    }
  };
  fetchChat = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { learnerId, courseId } = req.params;

      const chatMessage = await this._chatbotService.fetchChat(
        learnerId as string,
        courseId as string,
      );

      res
        .status(HttpStatus.OK)
        .json(successResponse(HttpResponse.OK, { chatMessage }));
    } catch (error) {
      next(error);
    }
  };
}
