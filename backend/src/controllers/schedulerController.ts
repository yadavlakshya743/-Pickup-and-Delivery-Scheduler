import { Request, Response } from 'express';
import redisClient from '../utils/redis';
import { publishEvent } from '../utils/kafka';
import prisma from '../utils/prisma';

export const assignOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, agent_id } = req.body;

        // 1. Verify that both order and agent exist
        const order = await prisma.order.findUnique({ where: { order_id } });
        const agent = await prisma.agent.findUnique({ where: { agent_id } });

        if (!order || !agent) {
            res.status(404).json({ success: false, message: 'Order or Agent not found.' });
            return;
        }

        // 2. Create Assignment in Database
        const assignment = await prisma.assignment.create({
            data: {
                order_id,
                agent_id,
                assignment_status: 'ASSIGNED',
            },
        });

        // 3. Update Order and Agent statuses
        await prisma.order.update({
            where: { order_id },
            data: { status: 'ASSIGNED' },
        });

        await prisma.agent.update({
            where: { agent_id },
            data: { status: 'BUSY' },
        });

        // 4. Publish `TaskAssigned` Event
        await publishEvent('TaskAssigned', {
            assignment_id: assignment.assignment_id,
            order_id,
            agent_id,
            status: 'ASSIGNED',
            timestamp: new Date(),
        });

        // 5. Cache assignment briefly in Redis
        await redisClient.set(`assignment:${assignment.assignment_id}`, JSON.stringify(assignment), 'EX', 3600);

        res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
