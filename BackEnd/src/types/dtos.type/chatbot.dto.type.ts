import { Types } from "mongoose";
import { IChatBot } from "../chatBot.type";

export interface IChatbotDTO extends IChatBot {
  _id: Types.ObjectId;
}
