import { Router } from 'express';
import { getAgents, updateAgentStatus, updateAgentLocation } from '../controllers/agentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Operators get a list of all agents
router.get('/', getAgents);

// Agents update their own status and location based on their auth token
router.put('/status', updateAgentStatus);
router.put('/location', updateAgentLocation);

export default router;
