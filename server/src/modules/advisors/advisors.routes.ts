import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  upsertMyProfile,
  getMyProfile,
  listAdvisors,
  getAdvisor,
} from './advisors.controller';
import { createAdvisorProfileSchema } from './advisors.validation';
import { idParamSchema } from '../businessPlans/businessPlans.validation';

const router = Router();

router.get('/', asyncHandler(listAdvisors));
router.get('/me', requireAuth, requireRole('ADVISOR'), asyncHandler(getMyProfile));
router.get('/:id', validateParams(idParamSchema), asyncHandler(getAdvisor));
router.post(
  '/profile',
  requireAuth,
  requireRole('ADVISOR'),
  validateBody(createAdvisorProfileSchema),
  asyncHandler(upsertMyProfile),
);

export default router;