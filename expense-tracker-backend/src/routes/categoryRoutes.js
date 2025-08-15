import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/', protect, getCategories);
router.post('/', protect, createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;