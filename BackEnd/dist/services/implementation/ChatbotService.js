"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const mongoose_1 = require("mongoose");
const error_message_const_1 = require("../../const/error-message.const");
const http_status_const_1 = require("../../const/http-status.const");
const chatbot_dto_1 = require("../../dtos/chatbot.dto");
const systemInstruction_template_1 = require("../../template/systemInstruction.template");
const chatBot_type_1 = require("../../types/chatBot.type");
const gemini_util_1 = require("../../utils/gemini.util");
const http_error_1 = require("../../utils/http-error");
const objectId_1 = require("../../mongoose/objectId");
class ChatbotService {
    constructor(_chatbotRepository, _enrolledRepository, _courseRepository) {
        this._chatbotRepository = _chatbotRepository;
        this._enrolledRepository = _enrolledRepository;
        this._courseRepository = _courseRepository;
    }
    async createChat(learnerId, courseId, message) {
        const course_Id = new mongoose_1.Types.ObjectId(courseId);
        const learner_Id = new mongoose_1.Types.ObjectId(learnerId);
        const isEnrolled = await this._enrolledRepository.findEnrlloedCourse({
            courseId: course_Id,
            learnerId: learner_Id,
        });
        if (!isEnrolled) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.NOT_ENROLLED);
        }
        const course = await this._courseRepository.getCourse(course_Id);
        console.log(course);
        if (!course) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.COURSE_NOT_FOUND);
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
            role: chatBot_type_1.Sender.USER,
            content: message,
            createdAt: new Date(),
        });
        const systemInstructionData = (0, systemInstruction_template_1.systemInstruction)(course);
        const contents = [
            systemInstructionData,
            ...chat.messages.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
        ];
        const aiReply = await (0, gemini_util_1.askGemini)(contents);
        chat.messages.push({
            role: chatBot_type_1.Sender.AI,
            content: aiReply,
            createdAt: new Date(),
        });
        const updatedChat = await this._chatbotRepository.updateChatbot(chat._id, {
            $set: { messages: chat.messages },
        });
        if (!updatedChat) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.INTERNAL_SERVER_ERROR, error_message_const_1.HttpResponse.SERVER_ERROR);
        }
        return (0, chatbot_dto_1.chatbotDTO)(updatedChat);
    }
    async fetchChat(learnerId, courseId) {
        const learner_Id = (0, objectId_1.parseObjectId)(learnerId);
        const course_Id = (0, objectId_1.parseObjectId)(courseId);
        if (!learner_Id || !course_Id) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
        }
        const getChtatbotChats = await this._chatbotRepository.findChat({
            learnerId,
            courseId,
        });
        if (!getChtatbotChats) {
            throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.NOT_FOUND, error_message_const_1.HttpResponse.ITEM_NOT_FOUND);
        }
        return (0, chatbot_dto_1.chatbotDTO)(getChtatbotChats);
    }
}
exports.ChatbotService = ChatbotService;
