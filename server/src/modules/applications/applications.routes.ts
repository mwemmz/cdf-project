import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createApplication,
  listMyApplications,
  getApplication,
  updateApplicationStatus,
} from './applications.controller';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from './applications.validation';
import { idParamSchema } from '../businessPlans/businessPlans.validation';

const router = Router();

router.use(requireAuth);

router.get('/mine', asyncHandler(listMyApplications));
router.post('/', requireRole('APPLICANT'), validateBody(createApplicationSchema), asyncHandler(createApplication));
router.get('/:id', validateParams(idParamSchema), asyncHandler(getApplication));
// Admin hooks into this endpoint for review/approval actions (built by the Admin team).
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validateParams(idParamSchema),
  validateBody(updateApplicationStatusSchema),
  asyncHandler(updateApplicationStatus),
);

export default router;