import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';
import { logger } from '../config/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    githubId: string;
    email?: string;
    orgId?: string;
  };
}

/**
 * JWT auth middleware — verifies the Bearer token from the Authorization header.
 * The token is issued by the DevFlow API after GitHub OAuth and includes user info.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('Missing or invalid authorization header', 401));
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET not configured');

    const decoded = jwt.verify(token, secret) as {
      id: string;
      githubId: string;
      email?: string;
      orgId?: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: (err as Error).message });
    next(createError('Invalid or expired token', 401));
  }
}
