import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { createReview, listAdvisorReviews } from './reviews.controller';
import { advisorIdParamSchema, createReviewSchema } from './reviews.validation';

const router = Router();

router.get('/advisor/:advisorId', validateParams(advisorIdParamSchema), asyncHandler(listAdvisorReviews));
router.post('/', requireAuth, requireRole('APPLICANT'), validateBody(createReviewSchema), asyncHandler(createReview));

export default router;