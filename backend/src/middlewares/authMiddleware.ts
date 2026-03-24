import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid token.' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient role permissions.' });
            return;
        }
        next();
    };
};
