import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'pickup-delivery-scheduler',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    ...(process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD && {
        ssl: true,
        sasl: {
            mechanism: 'scram-sha-256',
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
    }),
});

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: 'scheduler-group' });

export const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('Kafka Producer connected');
    } catch (error) {
        console.error('Error connecting Kafka Producer', error);
    }
};

export const connectConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Kafka Consumer connected');
    } catch (error) {
        console.error('Error connecting Kafka Consumer', error);
    }
};

export const publishEvent = async (topic: string, message: any) => {
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        console.log(`Event published to topic ${topic}`);
    } catch (error) {
        console.error(`Error publishing event to topic ${topic}`, error);
    }
};

export { kafka, producer, consumer };
