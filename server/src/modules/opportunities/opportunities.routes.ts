import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { listOpportunities, getOpportunity } from './opportunities.controller';

const router = Router();

router.get('/', asyncHandler(listOpportunities));
router.get('/:id', asyncHandler(getOpportunity));

export default router;