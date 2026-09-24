import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { createBusinessPlan, listMyPlans, getPlan, rescorePlan, updatePlan, linkAdvisorToPlan, unlinkAdvisorFromPlan } from './businessPlans.controller';
import { createBusinessPlanSchema, updateBusinessPlanSchema, idParamSchema } from './businessPlans.validation';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('APPLICANT'), validateBody(createBusinessPlanSchema), asyncHandler(createBusinessPlan));
router.get('/mine', asyncHandler(listMyPlans));
router.get('/:id', validateParams(idParamSchema), asyncHandler(getPlan));
router.patch('/:id', validateParams(idParamSchema), validateBody(updateBusinessPlanSchema), asyncHandler(updatePlan));
router.post('/:id/score', validateParams(idParamSchema), asyncHandler(rescorePlan));
router.post('/:id/advisor', requireRole('ADVISOR'), validateParams(idParamSchema), asyncHandler(linkAdvisorToPlan));
router.delete('/:id/advisor', requireRole('ADVISOR'), validateParams(idParamSchema), asyncHandler(unlinkAdvisorFromPlan));

export default router;