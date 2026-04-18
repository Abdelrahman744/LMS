import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries > 3) return false;
            return Math.min(retries * 500, 3000);
        }
    }
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err.message));

let isConnected = false;

const connectRedis = async () => {
    if (isConnected || redisClient.isOpen) {
        isConnected = true;
        return true;
    }
    try {
        await redisClient.connect();
        isConnected = true;
        console.log("Connected to Redis");
        return true;
    } catch (err) {
        isConnected = false;
        console.error("Redis connection failed:", err.message);
        return false;
    }
};

const getRedisClient = async () => {
    const connected = await connectRedis();
    return connected ? redisClient : null;
};

export default redisClient;
export { getRedisClient, connectRedis };