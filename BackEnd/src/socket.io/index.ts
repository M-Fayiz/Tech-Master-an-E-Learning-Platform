import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../config/env.config";
import { verifyAccesToken } from "../utils/jwt-token.util";
import redisClient from "../config/redis.config";
import { HttpResponse } from "../const/error-message.const";
import { SocketEvents } from "../const/socketEvents.const";
import { registerChatHandler } from "./chat.socket";
import { registerVideoHandlers } from "./video.socket";

interface CustomSocket extends Socket {
  data: { userId: string };
}

let io: Server;

const getCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${key}=`));
  return target
    ? decodeURIComponent(target.split("=").slice(1).join("="))
    : null;
};


export const intitializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket: CustomSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error(HttpResponse.UNAUTHORIZED));
    try {
      const user = verifyAccesToken(token);

      socket.data.userId = user._id;
      next();
    } catch {
      next(new Error(HttpResponse.UNAUTHORIZED));
    }
  });

  io.on(SocketEvents.CONNECT, async (socket: CustomSocket) => {
    const userId = socket.data.userId;

    if (!userId) {
      console.error("Socket connected without userId");
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);

    const key = `online:${userId}`;

    const before = await redisClient.sCard(key);
    await redisClient.sAdd(key, socket.id);
    const after = await redisClient.sCard(key);

    if (before === 0 && after === 1) {
      io.to(`user:${userId}`).emit(SocketEvents.USER_ONLINE, userId);
    }

    socket.on("presence:check", async (targetUserId: string) => {
      const exists = await redisClient.exists(`online:${targetUserId}`);
      socket.emit("presence:status", {
        userId: targetUserId,
        online: exists === 1,
      });
    });

    registerChatHandler(io, socket);
    registerVideoHandlers(io, socket);

    socket.on(SocketEvents.DISCONNECT, async () => {
      await redisClient.sRem(key, socket.id);
      const remaining = await redisClient.sCard(key);

      if (remaining === 0) {
        await redisClient.del(key);
        io.emit(SocketEvents.USER_OFFLINE, userId);
      }
    });
  });

  return io;
};

export const getIO = () => io;
