// server.js
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Reports API available at http://localhost:${PORT}/reports`);
  console.log(`🔑 Auth API available at http://localhost:${PORT}/auth`);
  console.log(`💰 Expenses API available at http://localhost:${PORT}/expenses`);
  console.log(`💵 Incomes API available at http://localhost:${PORT}/incomes`);
});