import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { listMyNotifications, getUnreadCount, markAllRead, markOneRead } from './notifications.controller';
import { notificationIdParamSchema } from './notifications.validation';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(listMyNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.post('/read-all', asyncHandler(markAllRead));
router.post('/:id/read', validateParams(notificationIdParamSchema), asyncHandler(markOneRead));

export default router;