import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error('ERROR:', err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  if (typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'ZodError') {
    return res.status(400).json({ success: false, error: 'Validation failed' });
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    if (code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A record with that value already exists' });
    }
    if (code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    if (code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Related record does not exist' });
    }
  }

  return res.status(500).json({ success: false, error: 'Internal server error' });
}