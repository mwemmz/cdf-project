import { Router } from 'express';
import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { getSummary, listApplications } from './admin.controller';
import {
  listAdvisors as listAdminAdvisors,
  setAdvisorVerification,
  setAdvisorVerificationSchema,
} from './admin-advisors.controller';
import {
  createOpportunity,
  updateOpportunity,
  createOpportunitySchema,
  updateOpportunitySchema,
} from './admin-opportunities.controller';
import { idParamSchema } from '../businessPlans/businessPlans.validation';

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
  validateQuery(
    z.object({
      status: z.nativeEnum(ApplicationStatus).optional(),
      opportunityId: z.string().min(1).optional(),
      limit: z.coerce.number().int().nonnegative().optional(),
      offset: z.coerce.number().int().nonnegative().optional(),
    }),
  ),
  asyncHandler(listApplications),
);

// Every advisor, unverified included, pending first.
router.get('/advisors', asyncHandler(listAdminAdvisors));

// Verify or unverify an advisor. Idempotent.
router.patch(
  '/advisors/:id/verify',
  validateParams(idParamSchema),
  validateBody(setAdvisorVerificationSchema),
  asyncHandler(setAdvisorVerification),
);

// Create a new opportunity.
router.post(
  '/opportunities',
  validateBody(createOpportunitySchema),
  asyncHandler(createOpportunity),
);

// Edit an existing opportunity.
router.patch(
  '/opportunities/:id',
  validateParams(idParamSchema),
  validateBody(updateOpportunitySchema),
  asyncHandler(updateOpportunity),
);

export default router;
