import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { buyProduct, listMyTransactions, listPaidAssessments, payForAssessment } from './payments.controller';

const router = Router();
router.use(requireAuth);

router.get('/mine', asyncHandler(listMyTransactions));
router.get('/assessments', asyncHandler(listPaidAssessments));
router.post('/purchase', asyncHandler(buyProduct));
router.post('/assessment', asyncHandler(payForAssessment));

export default router;
