import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { register, login, me } from './auth.controller';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));

export default router;