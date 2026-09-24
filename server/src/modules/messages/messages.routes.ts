import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { listMessages, sendMessage } from './messages.controller';
import { bookingIdParamSchema, messageBodySchema } from './messages.validation';

const router = Router();

router.use(requireAuth);

router.get('/:bookingId', validateParams(bookingIdParamSchema), asyncHandler(listMessages));
router.post('/:bookingId', validateParams(bookingIdParamSchema), validateBody(messageBodySchema), asyncHandler(sendMessage));

export default router;