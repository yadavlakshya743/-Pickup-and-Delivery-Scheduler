import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import agentRoutes from './routes/agentRoutes';
import schedulerRoutes from './routes/schedulerRoutes';

dotenv.config();

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Basic health-check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/scheduler', schedulerRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
