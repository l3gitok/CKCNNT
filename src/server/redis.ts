import { Redis } from "@upstash/redis";
import { env } from "~/env";

const createRedisClient = () => {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Trả về null hoặc throw error tùy vào logic của bạn nếu thiếu env
    // Ở đây mình log warning và trả về null để app không crash nếu chưa config
    console.warn("Redis env vars are missing. Caching will be disabled.");
    return null;
  }

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
};

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createRedisClient> | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
