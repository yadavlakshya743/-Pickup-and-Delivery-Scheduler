import app from './app';
import { setupConsumers } from './services/eventConsumer';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to Event Brokers (Handled by Redis on import)

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
