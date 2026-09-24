import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { listSuccessStories } from './showcase.controller';

const router = Router();

router.get('/', asyncHandler(listSuccessStories));

export default router;