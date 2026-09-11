import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { createBooking, listMyBookings, markBookingPaid } from './bookings.controller';
import { createBookingSchema, bookingIdParamSchema } from './bookings.validation';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createBookingSchema), asyncHandler(createBooking));
router.get('/mine', asyncHandler(listMyBookings));
router.post('/:id/pay', validateParams(bookingIdParamSchema), asyncHandler(markBookingPaid));

export default router;