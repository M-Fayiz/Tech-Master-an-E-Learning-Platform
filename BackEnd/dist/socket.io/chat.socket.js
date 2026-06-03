"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandler = void 0;
const ChatService_1 = require("../services/implementation/ChatService");
const error_message_const_1 = require("../const/error-message.const");
const ChatRepository_1 = require("../repository/implementation/ChatRepository");
const MessageRespository_1 = require("../repository/implementation/MessageRespository");
const objectId_1 = require("../mongoose/objectId");
const http_error_1 = require("../utils/http-error");
const http_status_const_1 = require("../const/http-status.const");
const socketEvents_const_1 = require("../const/socketEvents.const");
const message_type_1 = require("../types/message.type");
const chatRepository = new ChatRepository_1.ChatRepository();
const messageRepository = new MessageRespository_1.MessageRepository();
const chatService = new ChatService_1.ChatService(chatRepository, messageRepository);
function toMessageType(type) {
    if (!type)
        return message_type_1.MessageType.TEXT;
    if (!Object.values(message_type_1.MessageType).includes(type)) {
        throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, "Invalid message type");
    }
    return type;
}
const registerChatHandler = (io, socket) => {
    const userId = socket.data.userId;
    socket.on(socketEvents_const_1.ChatEvents.JOIN, async (payload) => {
        const { roomId } = payload || {};
        if (!roomId) {
            socket.emit(socketEvents_const_1.ChatEvents.ERROR, {
                message: error_message_const_1.HttpResponse.CHAT_ID_Required,
            });
            return;
        }
        const chat = await chatService.findChat(roomId);
        if (!chat) {
            socket.emit(socketEvents_const_1.ChatEvents.ERROR, {
                message: error_message_const_1.HttpResponse.CHAT_NOT_FOUND,
            });
            return;
        }
        if (!chat.users.map(String).includes(userId)) {
            socket.emit(socketEvents_const_1.ChatEvents.ERROR, {
                message: error_message_const_1.HttpResponse.NOT_PERMINTED,
            });
            return;
        }
        socket.join(`chat:${roomId}`);
        await new Promise((r) => setTimeout(r, 100));
        socket.to(`chat:${roomId}`).emit(socketEvents_const_1.ChatEvents.NOTIFICATION, { roomId });
    });
    socket.on(socketEvents_const_1.ChatEvents.SEND, async (payload, ack) => {
        try {
            const { roomId, content, mediaUrl } = payload;
            const type = toMessageType(payload.type);
            if (!roomId || (!content && type === message_type_1.MessageType.TEXT)) {
                return ack?.({ error: "Invalid payload" });
            }
            const chat = await chatService.findChat(roomId);
            if (!chat || !chat.users.map(String).includes(userId)) {
                return ack?.({ error: "Not a Participant" });
            }
            const room_id = (0, objectId_1.parseObjectId)(roomId);
            const senderId = (0, objectId_1.parseObjectId)(userId);
            if (!room_id || !senderId) {
                throw (0, http_error_1.createHttpError)(http_status_const_1.HttpStatus.BAD_REQUEST, error_message_const_1.HttpResponse.INVALID_ID);
            }
            const otherUsers = chat.users.map(String).filter((id) => id !== userId);
            if (otherUsers.length !== 1) {
                throw new Error("Invalid one-to-one chat state");
            }
            const receiverId = otherUsers[0];
            const messageData = await chatService.createMessage({
                chatId: room_id,
                sender: senderId,
                content,
                type,
                status: message_type_1.MessageStatus.SENT,
                mediaUrl,
            });
            let previewMessage = "Message";
            if (type === message_type_1.MessageType.TEXT)
                previewMessage = content;
            else if (type === message_type_1.MessageType.IMAGE)
                previewMessage = "📷 Image";
            else if (type === message_type_1.MessageType.PDF)
                previewMessage = "📎 File";
            else if (type === message_type_1.MessageType.VIDEO)
                previewMessage = "🎥 Video";
            await chatService.updateChat(room_id, {
                latestMessage: previewMessage,
                lastMessageTime: new Date().toISOString(),
            });
            const updatedChat = await chatService.incrementUnreadMSG(room_id, receiverId);
            io.to(`user:${receiverId}`).emit(socketEvents_const_1.ChatEvents.UPDATE, updatedChat);
            io.to(`user:${userId}`).emit(socketEvents_const_1.ChatEvents.UPDATE, updatedChat);
            io.to(`chat:${roomId}`).emit(socketEvents_const_1.ChatEvents.NEW_MESSAGE, {
                _id: messageData._id,
                roomId,
                sender: userId,
                content,
                type,
                mediaUrl,
                status: messageData.status,
                createdAt: messageData.createdAt,
            });
        }
        catch (error) {
            console.error("Error handling SEND event:", error);
            ack?.({ error: "Failed to send message" });
        }
    });
    socket.on(socketEvents_const_1.ChatEvents.DELIVERED, async ({ roomId, messageId }) => {
        const chat = await chatService.findChat(roomId);
        if (!chat || !chat.users.map(String).includes(userId))
            return;
        await chatService.updateMessage(messageId, {
            status: message_type_1.MessageStatus.DELIVERED,
        });
        io.to(`chat:${roomId}`).emit(socketEvents_const_1.ChatEvents.STATUS_UPDARE, {
            messageId,
            status: message_type_1.MessageStatus.DELIVERED,
        });
    });
    socket.on(socketEvents_const_1.ChatEvents.READ, async ({ roomId, messageIds }) => {
        const readerId = userId;
        await chatService.readMessages(messageIds);
        const updatedChat = await chatService.resetUnreadMsg(roomId, readerId);
        io.to(`user:${readerId}`).emit(socketEvents_const_1.ChatEvents.UPDATE, updatedChat);
    });
};
exports.registerChatHandler = registerChatHandler;
