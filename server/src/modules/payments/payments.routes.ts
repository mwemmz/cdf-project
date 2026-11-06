import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { getReceipt, buyProduct, listMyTransactions, listPaidAssessments, payForAssessment } from './payments.controller';

const router = Router();
router.use(requireAuth);

router.get('/mine', asyncHandler(listMyTransactions));
router.get('/assessments', asyncHandler(listPaidAssessments));
router.post('/purchase', asyncHandler(buyProduct));
router.get('/:id/receipt', asyncHandler(getReceipt));
router.post('/assessment', asyncHandler(payForAssessment));

export default router;
