import app from './app';
import { connectProducer, connectConsumer } from './utils/kafka';
import { setupConsumers } from './services/kafkaConsumer';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to Event Brokers
        await connectProducer();
        await connectConsumer();

        // Setup listeners
        await setupConsumers();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();
