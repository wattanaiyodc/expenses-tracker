// src/routes/expenseRoutes.js
import express from 'express';
import { getExpenses, createExpense , getDashboard, updateExpense, deleteExpense, getExpenseById} from '../controllers/expenseController.js';
import { protect } from '../middlewares/authMiddleware.js';
// หรือถ้าใช้ชื่ออื่น:
// import { authMiddleware as protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ใช้ middleware สำหรับทุก route
router.use(protect);

// Dashboard route ต้องมาก่อน /:id route
router.get('/dashboard', getDashboard);

// CRUD routes
router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;