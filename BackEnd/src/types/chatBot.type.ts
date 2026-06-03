import { Types } from "mongoose";

export interface IChatBot {
  learnerId: Types.ObjectId;
  courseId: Types.ObjectId;
  messages: IBotMessage[];
}
export enum Sender {
  USER = "user",
  AI = "model",
}
export interface IBotMessage {
  role: Sender;
  content: string;
  createdAt: Date;
}

export interface IchatbotUser {
  learnerId: Types.ObjectId;
  courseId: Types.ObjectId;
  messages: string;
}
