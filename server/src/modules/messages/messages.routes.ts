import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  listConversations,
  listMessages,
  sendMessage,
  openProductThread,
  listThreadMessages,
  sendThreadMessage,
} from './messages.controller';
import { bookingIdParamSchema, messageBodySchema, productIdParamSchema, threadIdParamSchema } from './messages.validation';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(listConversations));
router.post('/product/:productId', validateParams(productIdParamSchema), asyncHandler(openProductThread));
router.get('/thread/:threadId', validateParams(threadIdParamSchema), asyncHandler(listThreadMessages));
router.post('/thread/:threadId', validateParams(threadIdParamSchema), validateBody(messageBodySchema), asyncHandler(sendThreadMessage));
router.get('/:bookingId', validateParams(bookingIdParamSchema), asyncHandler(listMessages));
router.post('/:bookingId', validateParams(bookingIdParamSchema), validateBody(messageBodySchema), asyncHandler(sendMessage));

export default router;