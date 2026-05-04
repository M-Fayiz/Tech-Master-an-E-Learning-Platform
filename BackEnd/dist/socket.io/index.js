"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.intitializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_config_1 = require("../config/env.config");
const jwt_token_util_1 = require("../utils/jwt-token.util");
const redis_config_1 = __importDefault(require("../config/redis.config"));
const error_message_const_1 = require("../const/error-message.const");
const socketEvents_const_1 = require("../const/socketEvents.const");
const chat_socket_1 = require("./chat.socket");
const video_socket_1 = require("./video.socket");
let io;
const intitializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_config_1.env.CLIENT_ORGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error(error_message_const_1.HttpResponse.UNAUTHORIZED));
        try {
            const user = (0, jwt_token_util_1.verifyAccesToken)(token);
            socket.data.userId = user._id;
            next();
        }
        catch {
            next(new Error(error_message_const_1.HttpResponse.UNAUTHORIZED));
        }
    });
    io.on(socketEvents_const_1.SocketEvents.CONNECT, async (socket) => {
        const userId = socket.data.userId;
        if (!userId) {
            console.error("Socket connected without userId");
            socket.disconnect(true);
            return;
        }
        socket.join(`user:${userId}`);
        const key = `online:${userId}`;
        const before = await redis_config_1.default.sCard(key);
        await redis_config_1.default.sAdd(key, socket.id);
        const after = await redis_config_1.default.sCard(key);
        if (before === 0 && after === 1) {
            io.to(`user:${userId}`).emit(socketEvents_const_1.SocketEvents.USER_ONLINE, userId);
        }
        socket.on("presence:check", async (targetUserId) => {
            const exists = await redis_config_1.default.exists(`online:${targetUserId}`);
            socket.emit("presence:status", {
                userId: targetUserId,
                online: exists === 1,
            });
        });
        (0, chat_socket_1.registerChatHandler)(io, socket);
        (0, video_socket_1.registerVideoHandlers)(io, socket);
        socket.on(socketEvents_const_1.SocketEvents.DISCONNECT, async () => {
            await redis_config_1.default.sRem(key, socket.id);
            const remaining = await redis_config_1.default.sCard(key);
            if (remaining === 0) {
                await redis_config_1.default.del(key);
                io.emit(socketEvents_const_1.SocketEvents.USER_OFFLINE, userId);
            }
        });
    });
    return io;
};
exports.intitializeSocket = intitializeSocket;
const getIO = () => io;
exports.getIO = getIO;
