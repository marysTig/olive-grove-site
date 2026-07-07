import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  getProducts,
  updateProduct,
  uploadProductImage,
} from '@/controllers/product.controller';
import { protect } from '@/middlewares/auth.middleware';
import { restrictTo } from '@/middlewares/admin.middleware';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/upload-image', ...uploadProductImage);
router.get('/:slug', getProductBySlug);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
