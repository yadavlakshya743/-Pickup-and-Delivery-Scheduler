import { Router } from 'express';
import { createOrder, getOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);

export default router;
