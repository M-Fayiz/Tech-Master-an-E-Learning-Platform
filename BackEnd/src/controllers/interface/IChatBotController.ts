import { NextFunction, Request, Response } from "express";

export interface IChatbotController {
  chat(req: Request, res: Response, next: NextFunction): Promise<void>;
  fetchChat(req: Request, res: Response, next: NextFunction): Promise<void>;
}
