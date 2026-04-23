import { redisSubscriber } from '../utils/redis';
import prisma from '../utils/prisma';

export const setupConsumers = async () => {
    try {
        // Channels to subscribe to
        await redisSubscriber.subscribe('OrderCreated', 'TaskAssigned', 'StatusUpdated');

        redisSubscriber.on('message', async (channel, message) => {
            try {
                const payload = JSON.parse(message || '{}');
                console.log(`Received message on channel ${channel}:`, payload);

                // Store the event in the database for log auditing
                await prisma.eventLog.create({
                    data: {
                        event_type: channel,
                        entity_id: payload.order_id || payload.agent_id || 'UNKNOWN',
                        payload: payload,
                    },
                });

                // Topic specific logic
                switch (channel) {
                    case 'OrderCreated':
                        // E.g., The Scheduler Service could eagerly cache this order or match it with available agents
                        break;
                    case 'TaskAssigned':
                        // E.g., Notifications Service (if it existed) could SMS the Agent
                        break;
                    case 'StatusUpdated':
                        // E.g., The Order Service can use this to notify the Customer
                        break;
                    default:
                        console.warn(`No handler for channel: ${channel}`);
                }
            } catch (err) {
                console.error(`Error processing message from channel ${channel}:`, err);
            }
        });

        console.log('Redis Consumers are listening for events');
    } catch (error) {
        console.error('Error starting Redis Consumers', error);
    }
};
