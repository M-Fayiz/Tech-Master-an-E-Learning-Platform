import { GoogleGenAI } from "@google/genai";
import { Sender } from "../types/chatBot.type";
export type GeminiMessage = {
  role: Sender;
  parts: { text: string }[];
};

const genAI = new GoogleGenAI({});

export const askGemini = async (contents: GeminiMessage[]) => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  });
  return response.text;
};
