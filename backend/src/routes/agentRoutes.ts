import { Router } from 'express';
import { getAgents, getMyAgentProfile, toggleOnlineStatus, updateAgentStatus, updateAgentLocation, updateServiceArea } from '../controllers/agentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Agent gets their own profile (must be before GET / to avoid route conflict)
router.get('/me', getMyAgentProfile);

// Operators get a list of all agents
router.get('/', getAgents);

// Agents toggle their online/offline status
router.put('/online-status', toggleOnlineStatus);

// Agents update their operational status, location, and service area
router.put('/status', updateAgentStatus);
router.put('/location', updateAgentLocation);
router.put('/service-area', updateServiceArea);

export default router;
