import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../services/auth';
import { UserRole } from '../types';
import { logger } from '../config/logger';

/**
 * JWT authentication middleware.
 * Extracts the token from the Authorization: Bearer <token> header,
 * validates it via the auth service, and attaches req.user = { userId, role }.
 * Returns 401 if the token is missing or invalid.
 *
 * Requirements: 1.3
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const session = await validateSession(token);

    if (!session.isValid) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      userId: session.userId,
      role: session.role,
    };

    next();
  } catch (err) {
    logger.error('authenticateToken: unexpected error', { error: (err as Error).message });
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Role-guard middleware factory.
 * Checks req.user.role against the list of allowed roles.
 * Returns 403 if the user's role is not in the allowed list.
 * Must be used after authenticateToken.
 *
 * Requirements: 1.3
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
