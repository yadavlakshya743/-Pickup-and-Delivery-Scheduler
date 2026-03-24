import { Router } from 'express';
import { assignOrder } from '../controllers/schedulerController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Assign order to agent
router.post('/assign', assignOrder);

export default router;
