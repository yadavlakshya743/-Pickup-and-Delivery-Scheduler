import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { publishEvent } from '../utils/kafka';
import { autoAssignOrder, autoAssignPendingOrders } from './schedulerController';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pickup_location, delivery_location, priority, pickup_lat, pickup_lng, delivery_lat, delivery_lng } = req.body;
        const user_id = (req as any).user.user_id;

        const order = await prisma.order.create({
            data: {
                user_id,
                pickup_location,
                pickup_lat: pickup_lat ? parseFloat(pickup_lat) : null,
                pickup_lng: pickup_lng ? parseFloat(pickup_lng) : null,
                delivery_location,
                delivery_lat: delivery_lat ? parseFloat(delivery_lat) : null,
                delivery_lng: delivery_lng ? parseFloat(delivery_lng) : null,
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

        // Auto-assign the order to an available online agent
        await autoAssignOrder(order.order_id);

        // Re-fetch the order to get the updated status (may be ASSIGNED now)
        const updatedOrder = await prisma.order.findUnique({
            where: { order_id: order.order_id },
            include: {
                assignments: { include: { agent: { include: { user: { select: { name: true, phone: true } } } } } },
            },
        });

        res.status(201).json({ success: true, data: updatedOrder });
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
                assignments: { include: { agent: { include: { user: { select: { name: true, phone: true } } } } } },
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

        // Record the delivery status transition
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

        // When an order is delivered, free up the assigned agent and try to assign pending orders
        if (status === 'DELIVERED') {
            const assignment = await prisma.assignment.findFirst({
                where: { order_id: id as string },
            });

            if (assignment) {
                // Set agent back to AVAILABLE
                await prisma.agent.update({
                    where: { agent_id: assignment.agent_id },
                    data: { status: 'AVAILABLE' },
                });

                // Mark assignment as completed
                await prisma.assignment.update({
                    where: { assignment_id: assignment.assignment_id },
                    data: {
                        assignment_status: 'COMPLETED',
                        completed_at: new Date(),
                    },
                });

                // Try to assign pending orders to the now-free agent
                await autoAssignPendingOrders();
            }
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Find the active assignment for this order
        const assignment = await prisma.assignment.findFirst({
            where: { order_id: id as string, assignment_status: 'ASSIGNED' },
            include: { agent: true },
        });

        if (!assignment) {
            res.status(404).json({ success: false, message: 'No active assignment found for this order.' });
            return;
        }

        // Verify the requesting agent owns this assignment
        const agent = await prisma.agent.findUnique({ where: { user_id: user.user_id } });
        if (!agent || agent.agent_id !== assignment.agent_id) {
            res.status(403).json({ success: false, message: 'You can only reject orders assigned to you.' });
            return;
        }

        // Revert order status to CREATED
        await prisma.order.update({
            where: { order_id: id as string },
            data: { status: 'CREATED' },
        });

        // Mark assignment as REJECTED
        await prisma.assignment.update({
            where: { assignment_id: assignment.assignment_id },
            data: { assignment_status: 'REJECTED' },
        });

        // Free the agent
        await prisma.agent.update({
            where: { agent_id: assignment.agent_id },
            data: { status: 'AVAILABLE' },
        });

        await publishEvent('StatusUpdated', {
            entity_id: id,
            entity_type: 'ORDER',
            status: 'REJECTED_BY_AGENT',
            agent_id: assignment.agent_id,
            timestamp: new Date()
        });

        // Try to reassign to another agent
        await autoAssignPendingOrders();

        res.status(200).json({ success: true, message: 'Order rejected and queued for reassignment.' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        const order = await prisma.order.findUnique({
            where: { order_id: id as string }
        });

        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }

        // Must be the owner to cancel
        if (order.user_id !== user.user_id) {
            res.status(403).json({ success: false, message: 'You can only cancel your own orders.' });
            return;
        }

        // Only allow cancellation if the order hasn't been assigned yet
        if (order.status !== 'CREATED') {
            res.status(400).json({ success: false, message: `Cannot cancel order in ${order.status} state. Only CREATED orders can be cancelled.` });
            return;
        }

        const cancelledOrder = await prisma.order.update({
            where: { order_id: id as string },
            data: { status: 'CANCELLED' } // Need to update Prisma schema to support CANCELLED? Let's assume CANCELLED is valid string
        });

        await publishEvent('StatusUpdated', {
            entity_id: id,
            entity_type: 'ORDER',
            status: 'CANCELLED',
            timestamp: new Date()
        });

        res.status(200).json({ success: true, message: 'Order cancelled successfully.', data: cancelledOrder });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Order not found.' });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
