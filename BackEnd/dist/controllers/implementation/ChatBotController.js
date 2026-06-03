"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotController = void 0;
const http_status_const_1 = require("../../const/http-status.const");
const response_util_1 = require("../../utils/response.util");
const error_message_const_1 = require("../../const/error-message.const");
class ChatbotController {
    constructor(_chatbotService) {
        this._chatbotService = _chatbotService;
        this.chat = async (req, res, next) => {
            try {
                const { learnerId, courseId, message } = req.body;
                console.log("message :", message);
                const createdChat = await this._chatbotService.createChat(learnerId, courseId, message);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { createdChat }));
            }
            catch (error) {
                next(error);
            }
        };
        this.fetchChat = async (req, res, next) => {
            try {
                const { learnerId, courseId } = req.params;
                const chatMessage = await this._chatbotService.fetchChat(learnerId, courseId);
                res
                    .status(http_status_const_1.HttpStatus.OK)
                    .json((0, response_util_1.successResponse)(error_message_const_1.HttpResponse.OK, { chatMessage }));
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.ChatbotController = ChatbotController;
