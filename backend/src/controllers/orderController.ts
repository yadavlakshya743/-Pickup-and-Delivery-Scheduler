import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { publishEvent } from '../utils/kafka';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pickup_location, delivery_location, priority } = req.body;
        // req.user is populated by the authenticate middleware
        const user_id = (req as any).user.user_id;

        const order = await prisma.order.create({
            data: {
                user_id,
                pickup_location,
                delivery_location,
                priority: priority || 'STANDARD',
            },
        });

        await publishEvent('OrderCreated', {
            order_id: order.order_id,
            user_id: order.user_id,
            pickup_location: order.pickup_location,
            delivery_location: order.delivery_location,
            timestamp: new Date()
        });

        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        let whereClause = {};

        if (user.role === 'CUSTOMER') {
            whereClause = { user_id: user.user_id };
        } else if (user.role === 'AGENT') {
            // Find orders assigned to this agent's profile
            whereClause = {
                assignments: {
                    some: { agent: { user_id: user.user_id } }
                }
            };
        } else if (user.role === 'OPERATOR') {
            whereClause = {}; // Operators see everything
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                assignments: { include: { agent: { include: { user: { select: { name: true, phone: true } } } } } },
                delivery_statuses: true,
                user: { select: { name: true, email: true, phone: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { order_id: id as string },
            include: {
                assignments: true,
                delivery_statuses: true,
                user: { select: { name: true, email: true, phone: true } },
            },
        });

        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }

        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await prisma.order.update({
            where: { order_id: id as string },
            data: { status },
        });

        // Also record the delivery status transition
        await prisma.deliveryStatus.create({
            data: {
                order_id: id as string,
                status,
            },
        });

        await publishEvent('StatusUpdated', {
            entity_id: id,
            entity_type: 'ORDER',
            status: status,
            timestamp: new Date()
        });

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
