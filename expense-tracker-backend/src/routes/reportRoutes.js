// routes/reportRoutes.js (ES Modules version)
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  getReports, 
  
} from '../controllers/reportController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// GET /reports - Get financial reports data
// Query params: period (3months, 6months, 1year)
router.get('/', getReports);

// GET /reports/expenses - Get detailed expense analysis
// Query params: period, categoryId (optional)
//router.get('/expenses', getExpenseAnalysis);

// GET /reports/incomes - Get detailed income analysis
// Query params: period, categoryId (optional)
//router.get('/incomes', getIncomeAnalysis);


export default router;