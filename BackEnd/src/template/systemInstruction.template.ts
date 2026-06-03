import { Sender } from "../types/chatBot.type";
import { ICourses } from "../types/courses.type";

export const systemInstruction = (course: ICourses) => {
  const lecctureContent = course.sessions
    ?.map((session) => session.lectures.map((lecture) => lecture.title))
    .join(",");
  return {
    role: Sender.USER,
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
