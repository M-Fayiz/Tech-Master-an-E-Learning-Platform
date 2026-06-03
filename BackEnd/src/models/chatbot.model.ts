import { Schema, model, Types, Document } from "mongoose";
import { IBotMessage, IChatBot, Sender } from "../types/chatBot.type";
import { DbModelName } from "../const/modelName.const";

export interface IChatBotModel extends IChatBot, Document<Types.ObjectId> {}

const messageSchema = new Schema<IBotMessage>({
  role: {
    type: String,
    enum: Object.values(Sender),
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const courseChatSchema = new Schema<IChatBotModel>(
  {
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: DbModelName.USER,
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: DbModelName.COURSE,
      required: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true },
);

export const ChatbotModel = model(DbModelName.CHAT_BOT, courseChatSchema);
