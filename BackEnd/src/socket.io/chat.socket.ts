import { Server, Socket } from "socket.io";
import { ChatService } from "../services/implementation/ChatService";

import {
  ChatEmitEvents,
  ChatListenEvents,
} from "../types/socket.type/chatSocket.type";
import { SocketData } from "../types/socket.type/globalSocket.type";
import { HttpResponse } from "../const/error-message.const";
import { ChatRepository } from "../repository/implementation/ChatRepository";
import { MessageRepository } from "../repository/implementation/MessageRespository";
import { parseObjectId } from "../mongoose/objectId";
import { createHttpError } from "../utils/http-error";
import { HttpStatus } from "../const/http-status.const";
import { ChatEvents } from "../const/socketEvents.const";
import { MessageStatus, MessageType } from "../types/message.type";

const chatRepository = new ChatRepository();
const messageRepository = new MessageRepository();
const chatService = new ChatService(chatRepository, messageRepository);

function toMessageType(type?: string): MessageType {
  if (!type) return MessageType.TEXT;

  if (!Object.values(MessageType).includes(type as MessageType)) {
    throw createHttpError(HttpStatus.BAD_REQUEST, "Invalid message type");
  }

  return type as MessageType;
}

export const registerChatHandler = (
  io: Server,
  socket: Socket<ChatListenEvents, ChatEmitEvents, {}, SocketData>,
) => {
  const userId = socket.data.userId;

  socket.on(ChatEvents.JOIN, async (payload) => {
    const { roomId } = payload || {};

    if (!roomId) {
      socket.emit(ChatEvents.ERROR, {
        message: HttpResponse.CHAT_ID_Required,
      });
      return;
    }

    const chat = await chatService.findChat(roomId);
    if (!chat) {
      socket.emit(ChatEvents.ERROR, {
        message: HttpResponse.CHAT_NOT_FOUND,
      });
      return;
    }

    if (!chat.users.map(String).includes(userId)) {
      socket.emit(ChatEvents.ERROR, {
        message: HttpResponse.NOT_PERMINTED,
      });
      return;
    }

    socket.join(`chat:${roomId}`);

    await new Promise((r) => setTimeout(r, 100));

    socket.to(`chat:${roomId}`).emit(ChatEvents.NOTIFICATION, { roomId });
  });

  socket.on(ChatEvents.SEND, async (payload, ack) => {
    try {
      const { roomId, content, mediaUrl } = payload;

      const type = toMessageType(payload.type);

      if (!roomId || (!content && type === MessageType.TEXT)) {
        return ack?.({ error: "Invalid payload" });
      }

      const chat = await chatService.findChat(roomId);
      if (!chat || !chat.users.map(String).includes(userId)) {
        return ack?.({ error: "Not a Participant" });
      }

      const room_id = parseObjectId(roomId);
      const senderId = parseObjectId(userId);

      if (!room_id || !senderId) {
        throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
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
        status: MessageStatus.SENT,
        mediaUrl,
      });

      let previewMessage = "Message";
      if (type === MessageType.TEXT) previewMessage = content!;
      else if (type === MessageType.IMAGE) previewMessage = "📷 Image";
      else if (type === MessageType.PDF) previewMessage = "📎 File";
      else if (type === MessageType.VIDEO) previewMessage = "🎥 Video";

      await chatService.updateChat(room_id, {
        latestMessage: previewMessage,
        lastMessageTime: new Date().toISOString(),
      });

      const updatedChat = await chatService.incrementUnreadMSG(
        room_id,
        receiverId,
      );

      io.to(`user:${receiverId}`).emit(ChatEvents.UPDATE, updatedChat);
      io.to(`user:${userId}`).emit(ChatEvents.UPDATE, updatedChat);

      io.to(`chat:${roomId}`).emit(ChatEvents.NEW_MESSAGE, {
        _id: messageData._id,
        roomId,
        sender: userId,
        content,
        type,
        mediaUrl,
        status: messageData.status,
        createdAt: messageData.createdAt,
      });
    } catch (error) {
      console.error("Error handling SEND event:", error);
      ack?.({ error: "Failed to send message" });
    }
  });

  socket.on(ChatEvents.DELIVERED, async ({ roomId, messageId }) => {
    const chat = await chatService.findChat(roomId);
    if (!chat || !chat.users.map(String).includes(userId)) return;

    await chatService.updateMessage(messageId, {
      status: MessageStatus.DELIVERED,
    });

    io.to(`chat:${roomId}`).emit(ChatEvents.STATUS_UPDARE, {
      messageId,
      status: MessageStatus.DELIVERED,
    });
  });

  socket.on(ChatEvents.READ, async ({ roomId, messageIds }) => {
    const readerId = userId;

    await chatService.readMessages(messageIds);

    const updatedChat = await chatService.resetUnreadMsg(roomId, readerId);

    io.to(`user:${readerId}`).emit(ChatEvents.UPDATE, updatedChat);
  });
};
