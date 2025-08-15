import express from 'express';
import {
  getIncomes,
  createIncome,
  getIncomeDashboard,
  updateIncome,
  deleteIncome,
  getIncomeById
} from '../controllers/incomeController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ต้อง login ก่อนถึงจะเข้ามาได้
router.use(protect);

router.get('/', getIncomes);
router.post('/', createIncome);
router.get('/dashboard', getIncomeDashboard);
router.get('/:id', getIncomeById);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;
