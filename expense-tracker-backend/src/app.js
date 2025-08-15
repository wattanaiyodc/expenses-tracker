import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import expensesRoutes from './routes/expenseRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/expenses', expensesRoutes);


app.use(errorHandler);

export default app;
