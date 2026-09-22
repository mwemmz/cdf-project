import { Request, Response, NextFunction } from 'express';
import type { Role, User } from '@prisma/client';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
      user?: User;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    req.auth = { userId: user.id, role: user.role };
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}