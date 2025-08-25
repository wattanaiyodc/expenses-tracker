import { prisma } from '../prismaClient.js';

export const getIncomes = async (req, res, next) => {
  try {
    const incomes = await prisma.income.findMany({
      where: { userId: req.user.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(incomes);
  } catch (err) {
    next(err);
  }
};

export const createIncome = async (req, res, next) => {
  try {
    const { amount, categoryId, note, date } = req.body;
    const income = await prisma.income.create({
      data: {
        amount: parseFloat(amount),
        note,
        date: new Date(date),
        categoryId: parseInt(categoryId),
        userId: req.user.id
      },
      include: { category: true }
    });
    res.json(income);
  } catch (err) {
    next(err);
  }
};

// Dashboard รายรับ
// Dashboard รายรับ - แก้ไขชื่อ field ให้ตรงกับ Frontend
export const getIncomeDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // รายรับวันนี้
    const todayIncomeData = await prisma.income.aggregate({
      where: {
        userId,
        date: { gte: startOfDay, lt: endOfDay }
      },
      _sum: { amount: true }
    });

    // รายรับเดือนนี้
    const monthlyIncomeData = await prisma.income.aggregate({
      where: {
        userId,
        date: { gte: startOfMonth, lt: endOfMonth }
      },
      _sum: { amount: true }
    });

    // รายรับทั้งหมด
    const totalIncomeData = await prisma.income.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    // 5 รายการล่าสุด - เปลี่ยนชื่อตัวแปร
    const recentIncome = await prisma.income.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });

    // แยกตามหมวดหมู่
    const incomesByCategory = await prisma.income.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true }
    });

    const totalAmount = totalIncomeData._sum.amount || 0;
    const categoriesWithPercentage = await Promise.all(
      incomesByCategory.map(async (item) => {
        const category = await prisma.incomeCategory.findUnique({
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

    categoriesWithPercentage.sort((a, b) => b.amount - a.amount);

    // ข้อมูลรายวัน 7 วันล่าสุด
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyIncomeRaw = await prisma.$queryRaw`
      SELECT 
        DATE(date) as income_date,
        SUM(amount) as total_amount
      FROM "income"
      WHERE "userId" = ${userId}
        AND date >= ${sevenDaysAgo}
      GROUP BY DATE(date)
      ORDER BY DATE(date) ASC
    `;

    const dailyIncome = dailyIncomeRaw.map(item => ({
      date: item.income_date ? new Date(item.income_date).toISOString().split('T')[0] : null,
      amount: parseFloat(item.total_amount)
    }));

    // แก้ไขชื่อ field ให้ตรงกับ Frontend
    const dashboardData = {
      totalIncome: totalAmount,
      monthlyIncome: monthlyIncomeData._sum.amount || 0,
      todayIncome: todayIncomeData._sum.amount || 0,
      recentIncome,        // เปลี่ยนจาก recentIncomes
      incomeByCategory: categoriesWithPercentage,  // เปลี่ยนจาก incomesByCategory
      dailyIncome
    };

    console.log('Dashboard Data being sent:', dashboardData); // เพิ่ม log เพื่อ debug

    res.json(dashboardData);

  } catch (err) {
    console.error('getIncomeDashboard error:', err);
    next(err);
  }
};

// อัปเดต income
export const updateIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, categoryId, note, date } = req.body;

    const existingIncome = await prisma.income.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'ไม่พบรายการรายรับนี้' });
    }

    const income = await prisma.income.update({
      where: { id: parseInt(id) },
      data: {
        amount: parseFloat(amount),
        note,
        date: new Date(date),
        categoryId: parseInt(categoryId)
      },
      include: { category: true }
    });

    res.json(income);
  } catch (err) {
    next(err);
  }
};

// ลบ income
export const deleteIncome = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingIncome = await prisma.income.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'ไม่พบรายการรายรับนี้' });
    }

    await prisma.income.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'ลบรายการรายรับสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

// ดึง income ตาม id
export const getIncomeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const income = await prisma.income.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      include: { category: true }
    });

    if (!income) {
      return res.status(404).json({ message: 'ไม่พบรายการรายรับนี้' });
    }

    res.json(income);
  } catch (err) {
    next(err);
  }
};
