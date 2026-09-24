import express, { Application } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import opportunityRoutes from './modules/opportunities/opportunities.routes';
import businessPlanRoutes from './modules/businessPlans/businessPlans.routes';
import advisorRoutes from './modules/advisors/advisors.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import applicationRoutes from './modules/applications/applications.routes';
import repaymentRoutes from './modules/repayments/repayments.routes';
import productRoutes from './modules/products/products.routes';
import messageRoutes from './modules/messages/messages.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import showcaseRoutes from './modules/showcase/showcase.routes';
import resourceRoutes from './modules/resources/resources.routes';

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean),
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/api/business-plans', businessPlanRoutes);
  app.use('/api/advisors', advisorRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/repayments', repaymentRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/showcase', showcaseRoutes);
  app.use('/api/resources', resourceRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}