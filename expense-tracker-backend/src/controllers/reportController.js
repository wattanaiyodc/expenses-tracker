// controllers/reportController.js (วิธีแก้ง่ายที่สุด)
import { prisma } from '../prismaClient.js';

// Helper function to format month name in Thai
const getThaiMonthName = (date) => {
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return months[date.getMonth()];
};

// Helper function to get Thai day name
const getThaiDayName = (dayIndex) => {
  const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  return days[dayIndex];
};

// Helper function to check if dates are same day (ignore time)
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Helper function to filter data by period
const filterByPeriod = (data, period) => {
  if (period === 'all') return data;
  
  const now = new Date();
  let monthsBack;
  
  switch (period) {
    case '3months':
      monthsBack = 3;
      break;
    case '6months':
      monthsBack = 6;
      break;
    case '1year':
      monthsBack = 12;
      break;
    default:
      monthsBack = 6;
  }
  
  // สร้างวันที่เริ่มต้น
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(now.getMonth() - monthsBack);
  
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
};

// Get financial reports data - วิธีง่ายที่สุด
export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '6months' } = req.query;

    // เพิ่ม headers เพื่อป้องกัน cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    console.log('=== REPORTS START ===');
    console.log('User ID:', userId);
    console.log('Period:', period);

    // ดึงข้อมูล 1 ปีล่าสุด (ครอบคลุมทุก period)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const allExpenses = await prisma.expense.findMany({
      where: { 
        userId: userId,
        date: {
          gte: oneYearAgo
        }
      },
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    const allIncomes = await prisma.income.findMany({
      where: { 
        userId: userId,
        date: {
          gte: oneYearAgo
        }
      },
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    console.log('Expenses in last year:', allExpenses.length);
    console.log('Incomes in last year:', allIncomes.length);

    // กรองตาม period
    const expenses = filterByPeriod(allExpenses, period);
    const incomes = filterByPeriod(allIncomes, period);

    console.log('Expenses after filter:', expenses.length);
    console.log('Incomes after filter:', incomes.length);

    // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลทั้งหมดที่มี
    const finalExpenses = expenses.length > 0 ? expenses : allExpenses;
    const finalIncomes = incomes.length > 0 ? incomes : allIncomes;

    console.log('Final expenses:', finalExpenses.length);
    console.log('Final incomes:', finalIncomes.length);

    // Calculate monthly data
    const monthlyData = [];
    const monthlyMap = new Map();

    // Process expenses by month
    finalExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const month = getThaiMonthName(expenseDate);
      const year = expenseDate.getFullYear();
      const monthKey = `${month}-${year}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { 
          month, 
          year,
          income: 0, 
          expenses: 0, 
          net: 0 
        });
      }
      const monthData = monthlyMap.get(monthKey);
      monthData.expenses += expense.amount;
    });

    // Process incomes by month
    finalIncomes.forEach(income => {
      const incomeDate = new Date(income.date);
      const month = getThaiMonthName(incomeDate);
      const year = incomeDate.getFullYear();
      const monthKey = `${month}-${year}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { 
          month, 
          year,
          income: 0, 
          expenses: 0, 
          net: 0 
        });
      }
      const monthData = monthlyMap.get(monthKey);
      monthData.income += income.amount;
    });

    // Calculate net and convert to array
    monthlyMap.forEach((data) => {
      data.net = data.income - data.expenses;
      monthlyData.push(data);
    });

    // Sort monthly data chronologically
    monthlyData.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      const monthOrder = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                         'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    // Calculate category data
    const categoryData = [];
    
    // Group expenses by category
    const expenseCategories = new Map();
    finalExpenses.forEach(expense => {
      const categoryName = expense.category.name;
      if (!expenseCategories.has(categoryName)) {
        expenseCategories.set(categoryName, 0);
      }
      expenseCategories.set(categoryName, expenseCategories.get(categoryName) + expense.amount);
    });

    expenseCategories.forEach((value, name) => {
      categoryData.push({ name, value, type: 'expense' });
    });

    // Group incomes by category
    const incomeCategories = new Map();
    finalIncomes.forEach(income => {
      const categoryName = income.category.name;
      if (!incomeCategories.has(categoryName)) {
        incomeCategories.set(categoryName, 0);
      }
      incomeCategories.set(categoryName, incomeCategories.get(categoryName) + income.amount);
    });

    incomeCategories.forEach((value, name) => {
      categoryData.push({ name, value, type: 'income' });
    });

    // Calculate weekly data (last 7 days)
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      const dayName = getThaiDayName(targetDate.getDay());
      
      const dayExpenses = finalExpenses
        .filter(expense => isSameDay(expense.date, targetDate))
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const dayIncomes = finalIncomes
        .filter(income => isSameDay(income.date, targetDate))
        .reduce((sum, income) => sum + income.amount, 0);
      
      weeklyData.push({
        day: dayName,
        date: targetDate.toISOString().split('T')[0],
        income: dayIncomes,
        expenses: dayExpenses
      });
    }

    // Calculate summary
    const totalIncome = finalIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = finalExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    
    // Calculate averages
    const monthsCount = monthlyData.length || 1;
    const avgMonthlyIncome = totalIncome / monthsCount;
    const avgMonthlyExpenses = totalExpenses / monthsCount;
    
    // Calculate monthly growth
    let monthlyGrowth = 0;
    if (monthlyData.length >= 2) {
      const lastMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      if (previousMonth.net !== 0) {
        monthlyGrowth = ((lastMonth.net - previousMonth.net) / Math.abs(previousMonth.net)) * 100;
      }
    }

    const summary = {
      totalIncome,
      totalExpenses,
      netBalance,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      monthlyGrowth
    };

    const reportData = {
      monthlyData,
      categoryData,
      weeklyData,
      summary
    };

    console.log('=== REPORTS END ===');
    console.log('Monthly data count:', monthlyData.length);
    console.log('Category data count:', categoryData.length);
    console.log('Total income:', totalIncome);
    console.log('Total expenses:', totalExpenses);

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน',
      error: error.message
    });
  }
};

// Get detailed expense analysis
export const getExpenseAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '6months', categoryId } = req.query;

    let whereClause = { userId: userId };
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    // ดึงข้อมูล 1 ปีล่าสุด
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    whereClause.date = { gte: oneYearAgo };

    const allExpenses = await prisma.expense.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    // กรองตาม period
    const expenses = filterByPeriod(allExpenses, period);

    // Group by category
    const categoryAnalysis = new Map();
    expenses.forEach(expense => {
      const categoryName = expense.category.name;
      if (!categoryAnalysis.has(categoryName)) {
        categoryAnalysis.set(categoryName, {
          categoryName,
          categoryId: expense.categoryId,
          totalAmount: 0,
          transactionCount: 0,
          avgAmount: 0,
          transactions: []
        });
      }
      
      const analysis = categoryAnalysis.get(categoryName);
      analysis.totalAmount += expense.amount;
      analysis.transactionCount += 1;
      analysis.transactions.push({
        id: expense.id,
        amount: expense.amount,
        note: expense.note,
        date: expense.date
      });
    });

    // Calculate averages
    categoryAnalysis.forEach((analysis) => {
      analysis.avgAmount = analysis.totalAmount / analysis.transactionCount;
    });

    const analysisArray = Array.from(categoryAnalysis.values());
    analysisArray.sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        period,
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        categoryAnalysis: analysisArray
      }
    });

  } catch (error) {
    console.error('Error fetching expense analysis:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการวิเคราะห์รายจ่าย',
      error: error.message
    });
  }
};

// Get income analysis
export const getIncomeAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '6months', categoryId } = req.query;

    let whereClause = { userId: userId };
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    // ดึงข้อมูล 1 ปีล่าสุด
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    whereClause.date = { gte: oneYearAgo };

    const allIncomes = await prisma.income.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    // กรองตาม period
    const incomes = filterByPeriod(allIncomes, period);

    // Group by category
    const categoryAnalysis = new Map();
    incomes.forEach(income => {
      const categoryName = income.category.name;
      if (!categoryAnalysis.has(categoryName)) {
        categoryAnalysis.set(categoryName, {
          categoryName,
          categoryId: income.categoryId,
          totalAmount: 0,
          transactionCount: 0,
          avgAmount: 0,
          transactions: []
        });
      }
      
      const analysis = categoryAnalysis.get(categoryName);
      analysis.totalAmount += income.amount;
      analysis.transactionCount += 1;
      analysis.transactions.push({
        id: income.id,
        amount: income.amount,
        note: income.note,
        date: income.date
      });
    });

    // Calculate averages
    categoryAnalysis.forEach((analysis) => {
      analysis.avgAmount = analysis.totalAmount / analysis.transactionCount;
    });

    const analysisArray = Array.from(categoryAnalysis.values());
    analysisArray.sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        period,
        totalIncome: incomes.reduce((sum, inc) => sum + inc.amount, 0),
        categoryAnalysis: analysisArray
      }
    });

  } catch (error) {
    console.error('Error fetching income analysis:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการวิเคราะห์รายรับ',
      error: error.message
    });
  }
};