import { Request, Response } from 'express';
import redisClient from '../utils/redis';
import { publishEvent } from '../utils/kafka';
import prisma from '../utils/prisma';

/**
 * Calculate the distance between two lat/lng coordinates using the Haversine formula.
 * Returns the distance in kilometers.
 */
const haversineDistance = (
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const MAX_ASSIGNMENT_RADIUS_KM = 50; // Only assign agents within 50 km

/**
 * Auto-assign a single order to the closest available online agent within range.
 * If the order has no coordinates, falls back to the first available online agent.
 * Returns true if assignment succeeded, false if no agent was available.
 */
export const autoAssignOrder = async (orderId: string): Promise<boolean> => {
    try {
        const order = await prisma.order.findUnique({ where: { order_id: orderId } });
        if (!order) return false;

        // Find all online + available agents
        const availableAgents = await prisma.agent.findMany({
            where: {
                is_online: true,
                status: 'AVAILABLE',
            },
            orderBy: { created_at: 'asc' },
        });

        if (availableAgents.length === 0) {
            console.log(`No available online agent for order ${orderId}. Order stays in CREATED.`);
            return false;
        }

        // Extract city from pickup address for service_city matching
        // Nominatim addresses are comma-separated, city is typically in the middle parts
        const pickupParts = order.pickup_location.split(',').map(s => s.trim().toLowerCase());

        // Step 1: Filter agents by service_city match (if agents have set a service city)
        let cityMatchedAgents = availableAgents.filter(agent => {
            if (!agent.service_city) return true; // No service city set = accepts all
            return pickupParts.some(part => part.includes(agent.service_city!.toLowerCase()));
        });

        // If no agents match by city, don't assign (prevent cross-city assignment)
        if (cityMatchedAgents.length === 0) {
            console.log(`No agents serving the area for order ${orderId} (${order.pickup_location}). Order stays in CREATED.`);
            return false;
        }

        let selectedAgent = null;

        // Step 2: Among city-matched agents, use proximity-based assignment if coordinates exist
        if (order.pickup_lat != null && order.pickup_lng != null) {
            const agentsWithDistance = cityMatchedAgents
                .filter(agent => agent.current_lat != null && agent.current_lng != null)
                .map(agent => ({
                    ...agent,
                    distance: haversineDistance(
                        order.pickup_lat!, order.pickup_lng!,
                        agent.current_lat!, agent.current_lng!
                    ),
                }))
                .filter(agent => agent.distance <= MAX_ASSIGNMENT_RADIUS_KM)
                .sort((a, b) => a.distance - b.distance);

            if (agentsWithDistance.length > 0) {
                selectedAgent = agentsWithDistance[0];
                console.log(`Order ${orderId}: closest agent is ${selectedAgent.agent_id} at ${selectedAgent.distance.toFixed(1)} km`);
            } else {
                // Try agents without location but matching city
                const fallbackAgents = cityMatchedAgents.filter(a => a.current_lat == null);
                if (fallbackAgents.length > 0) {
                    selectedAgent = fallbackAgents[0];
                    console.log(`Order ${orderId}: using city-matched agent without GPS: ${selectedAgent.agent_id}`);
                } else {
                    console.log(`No agents within ${MAX_ASSIGNMENT_RADIUS_KM} km of order ${orderId}. Order stays in CREATED.`);
                    return false;
                }
            }
        } else {
            // No coordinates on order, just pick the first city-matched agent
            selectedAgent = cityMatchedAgents[0];
            console.log(`Order ${orderId} has no coordinates. Using city-matched agent ${selectedAgent.agent_id}.`);
        }

        // Create Assignment
        const assignment = await prisma.assignment.create({
            data: {
                order_id: orderId,
                agent_id: selectedAgent.agent_id,
                assignment_status: 'ASSIGNED',
            },
        });

        // Update Order status
        await prisma.order.update({
            where: { order_id: orderId },
            data: { status: 'ASSIGNED' },
        });

        // Update Agent status to BUSY
        await prisma.agent.update({
            where: { agent_id: selectedAgent.agent_id },
            data: { status: 'BUSY' },
        });

        // Publish TaskAssigned Event
        await publishEvent('TaskAssigned', {
            assignment_id: assignment.assignment_id,
            order_id: orderId,
            agent_id: selectedAgent.agent_id,
            status: 'ASSIGNED',
            timestamp: new Date(),
        });

        // Cache in Redis
        await redisClient.set(`assignment:${assignment.assignment_id}`, JSON.stringify(assignment), 'EX', 3600);

        console.log(`Order ${orderId} auto-assigned to agent ${selectedAgent.agent_id}`);
        return true;
    } catch (error) {
        console.error(`Error auto-assigning order ${orderId}:`, error);
        return false;
    }
};

/**
 * Try to auto-assign all pending (CREATED) orders to available online agents.
 * Called when an agent comes online or when a delivery is completed.
 */
export const autoAssignPendingOrders = async (): Promise<void> => {
    try {
        const pendingOrders = await prisma.order.findMany({
            where: { status: 'CREATED' },
            orderBy: { created_at: 'asc' },
        });

        for (const order of pendingOrders) {
            const assigned = await autoAssignOrder(order.order_id);
            if (!assigned) {
                // For proximity-based: continue trying other orders (different location may match different agents)
                continue;
            }
        }
    } catch (error) {
        console.error('Error auto-assigning pending orders:', error);
    }
};

/**
 * Manual assignment endpoint (kept as operator fallback).
 */
export const assignOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, agent_id } = req.body;

        // Verify that both order and agent exist
        const order = await prisma.order.findUnique({ where: { order_id } });
        const agent = await prisma.agent.findUnique({ where: { agent_id } });

        if (!order || !agent) {
            res.status(404).json({ success: false, message: 'Order or Agent not found.' });
            return;
        }

        // Create Assignment
        const assignment = await prisma.assignment.create({
            data: {
                order_id,
                agent_id,
                assignment_status: 'ASSIGNED',
            },
        });

        // Update Order and Agent statuses
        await prisma.order.update({
            where: { order_id },
            data: { status: 'ASSIGNED' },
        });

        await prisma.agent.update({
            where: { agent_id },
            data: { status: 'BUSY' },
        });

        // Publish TaskAssigned Event
        await publishEvent('TaskAssigned', {
            assignment_id: assignment.assignment_id,
            order_id,
            agent_id,
            status: 'ASSIGNED',
            timestamp: new Date(),
        });

        // Cache in Redis
        await redisClient.set(`assignment:${assignment.assignment_id}`, JSON.stringify(assignment), 'EX', 3600);

        res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
