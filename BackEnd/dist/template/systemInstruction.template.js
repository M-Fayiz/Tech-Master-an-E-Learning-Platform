"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemInstruction = void 0;
const chatBot_type_1 = require("../types/chatBot.type");
const systemInstruction = (course) => {
    const lecctureContent = course.sessions
        ?.map((session) => session.lectures.map((lecture) => lecture.title))
        .join(",");
    return {
        role: chatBot_type_1.Sender.USER,
        parts: [
            {
                text: `
      You are an AI teaching assistant for this course.
      
      Course title: ${course.title}
      Course level: ${course.level}
      
      Lecture content:
      ${lecctureContent}
      
      Your job:
      - Help students understand this lecture
      - Explain in simple terms
      - Answer only doubts related to this lecture
      - Do NOT go outside the lecture content
            `,
            },
        ],
    };
};
exports.systemInstruction = systemInstruction;
