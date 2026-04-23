import { Router } from 'express';
import { createOrder, getOrder, getOrders, updateOrderStatus, rejectOrder, cancelOrder } from '../controllers/orderController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/reject', rejectOrder);
router.put('/:id/cancel', cancelOrder);

export default router;
