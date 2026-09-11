import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { createBusinessPlan, listMyPlans, getPlan, rescorePlan } from './businessPlans.controller';
import { createBusinessPlanSchema, idParamSchema } from './businessPlans.validation';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('APPLICANT'), validateBody(createBusinessPlanSchema), asyncHandler(createBusinessPlan));
router.get('/mine', asyncHandler(listMyPlans));
router.get('/:id', validateParams(idParamSchema), asyncHandler(getPlan));
router.post('/:id/score', validateParams(idParamSchema), asyncHandler(rescorePlan));

export default router;