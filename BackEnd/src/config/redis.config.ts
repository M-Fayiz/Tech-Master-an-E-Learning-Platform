import { RedisClientType, createClient } from "redis";
import { env } from "./env.config";

const redisClient: RedisClientType = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnect attempt ${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("🛜 Redis connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error", err);
});

redisClient.connect();

export default redisClient;
