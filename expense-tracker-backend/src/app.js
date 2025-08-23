import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import expensesRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import incomeCategoryRoutes from './routes/incomeCategoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/expenses', expensesRoutes);
app.use('/incomes', incomeRoutes);
app.use('/income-categories', incomeCategoryRoutes);
app.use('/reports', reportRoutes);
app.use(errorHandler);

export default app;
