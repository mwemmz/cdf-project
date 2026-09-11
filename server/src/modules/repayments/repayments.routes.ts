import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { addRepayment, getRepaymentsForApplication } from './repayments.controller';
import { createRepaymentSchema, applicationIdParamSchema } from './repayments.validation';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('APPLICANT'), validateBody(createRepaymentSchema), asyncHandler(addRepayment));
router.get(
  '/application/:applicationId',
  validateParams(applicationIdParamSchema),
  asyncHandler(getRepaymentsForApplication),
);

export default router;