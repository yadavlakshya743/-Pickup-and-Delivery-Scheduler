import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import { publishEvent } from '../utils/kafka';
import { autoAssignPendingOrders } from './schedulerController';

export const getAgents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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

export const getMyAgentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.user_id;

        const agent = await prisma.agent.findUnique({
            where: { user_id: userId },
            include: {
                user: { select: { name: true, phone: true, email: true } }
            }
        });

        if (!agent) {
            res.status(404).json({ success: false, message: 'Agent profile not found.' });
            return;
        }

        res.status(200).json({ success: true, data: agent });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleOnlineStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.user_id;
        const { is_online } = req.body;

        if (typeof is_online !== 'boolean') {
            res.status(400).json({ success: false, message: 'is_online must be a boolean value.' });
            return;
        }

        const updatedAgent = await prisma.agent.update({
            where: { user_id: userId },
            data: { is_online },
        });

        await publishEvent('StatusUpdated', {
            entity_id: updatedAgent.agent_id,
            entity_type: 'AGENT',
            status: is_online ? 'ONLINE' : 'OFFLINE',
            timestamp: new Date()
        });

        // When an agent comes online, try to assign any pending orders to them
        if (is_online && updatedAgent.status === 'AVAILABLE') {
            await autoAssignPendingOrders();
        }

        res.status(200).json({ success: true, data: updatedAgent });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Agent profile not found.' });
            return;
        }
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

        if (latitude == null || longitude == null) {
            res.status(400).json({ success: false, message: 'latitude and longitude are required.' });
            return;
        }

        const updatedAgent = await prisma.agent.update({
            where: { user_id: userId },
            data: {
                current_lat: parseFloat(latitude),
                current_lng: parseFloat(longitude),
            },
        });

        await publishEvent('StatusUpdated', {
            entity_id: updatedAgent.agent_id,
            entity_type: 'AGENT',
            status: 'LOCATION_UPDATED',
            latitude,
            longitude,
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

export const updateServiceArea = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.user_id;
        const { service_city } = req.body;

        if (!service_city || typeof service_city !== 'string') {
            res.status(400).json({ success: false, message: 'service_city is required and must be a string.' });
            return;
        }

        const updatedAgent = await prisma.agent.update({
            where: { user_id: userId },
            data: { service_city: service_city.trim() },
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
