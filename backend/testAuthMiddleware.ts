import { authorize, AuthRequest } from './src/middlewares/authMiddleware';
import { Response, NextFunction } from 'express';

const res = {
    status: (code: number) => ({
        json: (data: any) => console.log(`Response [${code}]:`, data)
    })
} as Response;

const next: NextFunction = () => console.log("Next called");

// Test 1: Authorized User
const req1 = {
    user: { role: 'OPERATOR' }
} as AuthRequest;
console.log("Test 1: Operator accessing operator route");
authorize(['OPERATOR'])(req1, res, next); // Should call Next

// Test 2: Unauthorized User
const req2 = {
    user: { role: 'CUSTOMER' }
} as AuthRequest;
console.log("\nTest 2: Customer accessing operator route");
authorize(['OPERATOR'])(req2, res, next); // Should return 403

// Test 3: No user context
const req3 = {} as AuthRequest;
console.log("\nTest 3: Unauthenticated access");
authorize(['CUSTOMER'])(req3, res, next); // Should return 403
