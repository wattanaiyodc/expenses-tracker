import { prisma } from '../prismaClient.js';

export const getExpenses = async (req, res, next) => {
  try {
    console.log('getExpenses called, user ID:', req.user?.id);
    
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Found expenses:', expenses.length);
    res.json(expenses);
  } catch (err) {
    console.error('getExpenses error:', err);
    next(err);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { amount, categoryId, note, date } = req.body;
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        note,
        date: new Date(date),
        categoryId: parseInt(categoryId),
        userId: req.user.id
      },
      include: { category: true }
    });
    res.json(expense);
  } catch (err) {
    next(err);
  }
};

// เพิ่มฟังก์ชัน dashboard ที่ frontend ต้องการ
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // ค่าใช้จ่ายวันนี้
    const todayExpensesData = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      _sum: { amount: true }
    });

    // ค่าใช้จ่ายเดือนนี้
    const monthlyExpensesData = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      },
      _sum: { amount: true }
    });

    // ค่าใช้จ่ายทั้งหมด
    const totalExpensesData = await prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    // รายการล่าสุด 5 รายการ
    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });

    // ค่าใช้จ่ายแยกตามหมวดหมู่
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true }
    });

    // คำนวณเปอร์เซ็นต์
    const totalAmount = totalExpensesData._sum.amount || 0;
    const categoriesWithPercentage = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId }
        });
        const amount = item._sum.amount || 0;
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        
        return {
          category: category?.name || 'Unknown',
          amount,
          percentage
        };
      })
    );

    // เรียงลำดับตามจำนวนเงิน
    categoriesWithPercentage.sort((a, b) => b.amount - a.amount);

    // ข้อมูลรายวัน 7 วันล่าสุด
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyExpensesRaw = await prisma.$queryRaw`
  SELECT 
    DATE(date) as expense_date,
    SUM(amount) as total_amount
  FROM "expenses"
  WHERE "userId" = ${userId}
    AND date >= ${sevenDaysAgo}
  GROUP BY DATE(date)
  ORDER BY DATE(date) ASC
`;


    const dailyExpenses = dailyExpensesRaw.map(item => ({
      date: item.expense_date ? new Date(item.expense_date).toISOString().split('T')[0] : null,
      amount: parseFloat(item.total_amount)
    }));

    const dashboardData = {
      totalExpenses: totalAmount,
      monthlyExpenses: monthlyExpensesData._sum.amount || 0,
      todayExpenses: todayExpensesData._sum.amount || 0,
      recentExpenses,
      expensesByCategory: categoriesWithPercentage,
      dailyExpenses
    };

    res.json(dashboardData);

  } catch (err) {
    console.error('getDashboard error:', err);
    next(err);
  }
};

// อัปเดต expense
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, categoryId, note, date } = req.body;

    // ตรวจสอบว่า expense นี้เป็นของ user หรือไม่
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    if (!existingExpense) {
      return res.status(404).json({ message: 'ไม่พบรายการค่าใช้จ่ายนี้' });
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        amount: parseFloat(amount),
        note,
        date: new Date(date),
        categoryId: parseInt(categoryId)
      },
      include: { category: true }
    });

    res.json(expense);
  } catch (err) {
    next(err);
  }
};

// ลบ expense
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่า expense นี้เป็นของ user หรือไม่
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    if (!existingExpense) {
      return res.status(404).json({ message: 'ไม่พบรายการค่าใช้จ่ายนี้' });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'ลบรายการค่าใช้จ่ายสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

// ดึง expense ตาม id
export const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const expense = await prisma.expense.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      include: { category: true }
    });

    if (!expense) {
      return res.status(404).json({ message: 'ไม่พบรายการค่าใช้จ่ายนี้' });
    }

    res.json(expense);
  } catch (err) {
    next(err);
  }
};