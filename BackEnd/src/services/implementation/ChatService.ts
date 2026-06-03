import { Types, FilterQuery } from "mongoose";
import { HttpResponse } from "../../const/error-message.const";
import { HttpStatus } from "../../const/http-status.const";
import { chatDto, chatListDTO } from "../../dtos/chat.dto";
import { MessageDto } from "../../dtos/messaage.dto";

import { parseObjectId } from "../../mongoose/objectId";
import { IChatRespository } from "../../repository/interface/IChatRepository";
import { IMessageRepository } from "../../repository/interface/IMessageRepository";
import { IChat } from "../../types/chat.type";
import {
  IChatDTO,
  IChatListDTO,
  IChatPopulated,
} from "../../types/dtos.type/chat.dto.types";
import { IMessageDto } from "../../types/dtos.type/message.dto.type";
import { IMessage } from "../../types/message.type";
import { createHttpError } from "../../utils/http-error";
import { generateParticipantKey } from "../../utils/participantKey.util";
import { IChatService } from "../interface/IChatService";

export class ChatService implements IChatService {
  constructor(
    private _chatRepository: IChatRespository,
    private _messageRepository: IMessageRepository,
  ) {}

  async getOrCreateRoom(
    senderId: string,
    receiverId: string,
  ): Promise<IChatDTO> {
    const sender_Id = parseObjectId(senderId);
    const receiver_Id = parseObjectId(receiverId);
    if (!sender_Id || !receiver_Id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const participentKey = generateParticipantKey(senderId, receiverId);

    let chat = await this._chatRepository.getChat(participentKey);
    if (!chat) {
      chat = await this._chatRepository.createChat({
        users: [sender_Id, receiver_Id],
        participantKey: participentKey,
      });
    }

    return chatDto(chat);
  }
  async findChat(chatId: string): Promise<IChatDTO> {
    const chat_id = parseObjectId(chatId);
    if (!chat_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const chatData = await this._chatRepository.findChatId(chat_id);
    if (!chatData) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.CHAT_NOT_FOUND);
    }
    return chatDto(chatData);
  }
  async createMessage(data: Partial<IMessage>): Promise<IMessageDto> {
    const createdData = await this._messageRepository.createMessage(data);
    return MessageDto(createdData);
  }
  async updateChat(
    chatId: Types.ObjectId,
    filter: FilterQuery<IChat>,
  ): Promise<IChatDTO> {
    const updateData = await this._chatRepository.updateChat(chatId, filter);
    if (!updateData) {
      throw createHttpError(HttpStatus.OK, HttpResponse.ITEM_NOT_FOUND);
    }

    return chatDto(updateData);
  }
  async updateMessage(
    messageId: string,
    filter: FilterQuery<IMessage>,
  ): Promise<IMessageDto> {
    const message_id = parseObjectId(messageId);

    if (!message_id) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.INVALID_ID);
    }

    const updatedMessage = await this._messageRepository.updateMessage(
      message_id,
      filter,
    );

    if (!updatedMessage) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.ITEM_NOT_FOUND);
    }

    return MessageDto(updatedMessage);
  }
  async listUsers(senderId: string): Promise<IChatListDTO[]> {
    const sender_Id = parseObjectId(senderId);

    if (!sender_Id) {
      throw createHttpError(HttpStatus.NOT_FOUND, HttpResponse.INVALID_ID);
    }
    const populatedData = await this._chatRepository.listUsers(sender_Id);

    const filteredData = populatedData?.map((chat) => {
      const otherUsers = chat.users.filter(
        (user) => user._id.toString() !== sender_Id.toString(),
      );

      return { ...chat, users: otherUsers };
    });

    return (
      filteredData?.map((chat) => chatListDTO(chat as IChatPopulated)) ?? []
    );
  }
  async getMessages(chatId: string, limit: number): Promise<IMessageDto[]> {
    const chat_id = parseObjectId(chatId);

    if (!chat_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const messages = await this._messageRepository.getChats(chat_id, limit);
    return (messages || []).map((msg) => MessageDto(msg));
  }
  async readMessages(messageIds: string[]): Promise<IMessageDto[]> {
    const message_Ids = messageIds.map((id) => parseObjectId(id));

    if (!message_Ids) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const updatedData = await this._messageRepository.readMessage(
      message_Ids as Types.ObjectId[],
    );

    if (!updatedData) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }

    return updatedData.map((data) => MessageDto(data));
  }
  async incrementUnreadMSG(
    chatId: Types.ObjectId,
    userId: string,
  ): Promise<IChatDTO> {
    const user_id = parseObjectId(userId);
    if (!user_id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }
    const updatedData = await this._chatRepository.IncrementUnreadMsg(
      chatId,
      user_id,
    );
    if (!updatedData) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }
    return chatDto(updatedData);
  }
  async resetUnreadMsg(chatId: string, userId: string): Promise<IChatDTO> {
    const user_id = parseObjectId(userId);
    const chat_Id = parseObjectId(chatId);

    if (!user_id || !chat_Id) {
      throw createHttpError(HttpStatus.BAD_REQUEST, HttpResponse.INVALID_ID);
    }

    const updatedData = await this._chatRepository.resetUnreadMsg(
      chat_Id,
      user_id,
    );

    if (!updatedData) {
      throw createHttpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpResponse.SERVER_ERROR,
      );
    }
    return chatDto(updatedData);
  }
}
