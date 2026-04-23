import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

const redisConfig = {
    host: redisHost,
    port: redisPort,
};

const redisClient = new Redis(redisConfig);
const redisPublisher = new Redis(redisConfig);
const redisSubscriber = new Redis(redisConfig);

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
