import { consumer } from '../utils/kafka';
import prisma from '../utils/prisma';

export const setupConsumers = async () => {
    try {
        // Topics to subscribe to
        await consumer.subscribe({ topic: 'OrderCreated', fromBeginning: true });
        await consumer.subscribe({ topic: 'TaskAssigned', fromBeginning: true });
        await consumer.subscribe({ topic: 'StatusUpdated', fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const payload = JSON.parse(message.value?.toString() || '{}');
                console.log(`Received message on topic ${topic}:`, payload);

                // Store the event in the database for log auditing
                await prisma.eventLog.create({
                    data: {
                        event_type: topic,
                        entity_id: payload.order_id || payload.agent_id || 'UNKNOWN',
                        payload: payload,
                    },
                });

                // Topic specific logic
                switch (topic) {
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
                        console.warn(`No handler for topic: ${topic}`);
                }
            },
        });

        console.log('Kafka Consumers are listening');
    } catch (error) {
        console.error('Error starting Kafka Consumers', error);
    }
};
