import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  listProductsForPublic,
  listMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.controller';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from './products.validation';

const router = Router();

// Public marketplace — no auth required
router.get('/', asyncHandler(listProductsForPublic));

// Seller endpoints
router.use(requireAuth, requireRole('APPLICANT'));
router.get('/mine', asyncHandler(listMyProducts));
router.post('/', validateBody(createProductSchema), asyncHandler(createProduct));
router.patch('/:id', validateParams(productIdParamSchema), validateBody(updateProductSchema), asyncHandler(updateProduct));
router.delete('/:id', validateParams(productIdParamSchema), asyncHandler(deleteProduct));

export default router;