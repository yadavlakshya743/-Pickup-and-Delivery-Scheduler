import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already exists.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = Object.values(Role).includes(role as Role) ? (role as Role) : Role.CUSTOMER;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: userRole,
                ...(userRole === Role.AGENT && { agent: { create: { status: 'AVAILABLE' } } }),
            },
            select: { user_id: true, name: true, email: true, role: true },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }

        const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { credential, role } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ success: false, message: 'Invalid Google token.' });
            return;
        }

        const email = payload.email;
        const name = payload.name || 'Google User';

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const userRole = Object.values(Role).includes(role as Role) ? (role as Role) : Role.CUSTOMER;

            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone: '',
                    password: hashedPassword,
                    role: userRole,
                    ...(userRole === Role.AGENT && { agent: { create: { status: 'AVAILABLE' } } }),
                },
            });
        }

        const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
