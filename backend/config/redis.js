import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl =
  process.env.REDIS_URL ||
  `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

client.on("error", (err) => console.error("[Redis] Error:", err));
client.on("connect", () => console.log("[Redis] Connected"));

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export default client;
