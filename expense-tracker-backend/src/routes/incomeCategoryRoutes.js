import express from 'express';
import {
  getIncomeCategories,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory
} from '../controllers/incomeCategoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getIncomeCategories);
router.post('/', createIncomeCategory);
router.put('/:id', updateIncomeCategory);
router.delete('/:id', deleteIncomeCategory);

export default router;
