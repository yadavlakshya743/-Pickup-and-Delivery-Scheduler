import Redis from 'ioredis';

// Support REDIS_URL (for Upstash / cloud with TLS) or fallback to host/port (local dev)
const createRedisClient = () => {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL, {
            tls: { rejectUnauthorized: false },
            maxRetriesPerRequest: 3,
        });
    }
    return new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    });
};

const redisClient = createRedisClient();
const redisPublisher = createRedisClient();
const redisSubscriber = createRedisClient();

redisClient.on('error', (err) => console.error('Redis connection error:', err));
redisClient.on('connect', () => console.log('Connected to Redis Cache'));

redisSubscriber.on('connect', () => console.log('Connected to Redis Subscriber'));
redisPublisher.on('connect', () => console.log('Connected to Redis Publisher'));

export const publishEvent = async (topic: string, message: any) => {
    try {
        await redisPublisher.publish(topic, JSON.stringify(message));
        console.log(`Event published to channel ${topic}`);
    } catch (error) {
        console.error(`Error publishing event to channel ${topic}`, error);
    }
};

export default redisClient;
export { redisPublisher, redisSubscriber };
