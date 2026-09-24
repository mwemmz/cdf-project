import { Router } from 'express';
import { validateParams, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { getResource, listResources } from './resources.controller';
import { resourceIdParamSchema, resourceQuerySchema } from './resources.validation';

const router = Router();

router.get('/', validateQuery(resourceQuerySchema), asyncHandler(listResources));
router.get('/:id', validateParams(resourceIdParamSchema), asyncHandler(getResource));

export default router;