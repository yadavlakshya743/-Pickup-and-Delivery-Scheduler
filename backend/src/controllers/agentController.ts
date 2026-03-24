import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { publishEvent } from '../utils/kafka';

export const getAgents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Find all agents, including their underlying user details (name, phone)
        const agents = await prisma.agent.findMany({
            include: {
                user: { select: { name: true, phone: true, email: true } }
            }
        });

        res.status(200).json({ success: true, data: agents });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAgentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.user_id;
        const { status } = req.body;

        const updatedAgent = await prisma.agent.update({
            where: { user_id: userId },
            data: { status },
        });

        await publishEvent('StatusUpdated', {
            entity_id: updatedAgent.agent_id,
            entity_type: 'AGENT',
            status: status,
            timestamp: new Date()
        });

        res.status(200).json({ success: true, data: updatedAgent });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Agent profile not found.' });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAgentLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.user_id;
        const { latitude, longitude } = req.body;

        // In a real application, you might use PostGIS or store this in Redis. 
        // For this boilerplate, we'll assume the real-time logic will be expanded upon.

        // Returning a mock success since location isn't currently in the Prisma schema
        res.status(200).json({ success: true, message: `Location updated to [${latitude}, ${longitude}] for agent user ${userId}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
