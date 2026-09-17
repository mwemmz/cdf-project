import { Router } from 'express';
import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { getSummary, listApplications } from './admin.controller';

const router = Router();

// Mounted once at /api/admin. Everything below this line requires an
// authenticated admin, so no admin endpoint can forget to gate itself.
router.use(requireAuth, requireRole('ADMIN'));

// Namespace probe — proves the guard end to end. Real endpoints arrive in
// later tickets (summary, applications, advisors, opportunities).
router.get(
  '/ping',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: { area: 'admin' } });
  }),
);

// Platform summary powering the dashboard.
router.get('/summary', asyncHandler(getSummary));

// Full application queue across all applicants, optionally filtered by stage.
router.get(
  '/applications',
  validateQuery(z.object({ status: z.nativeEnum(ApplicationStatus).optional() })),
  asyncHandler(listApplications),
);

export default router;
