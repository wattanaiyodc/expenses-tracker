import { prisma } from '../prismaClient.js';

export const getIncomeCategories = async (req, res, next) => {
  try {
    const categories = await prisma.incomeCategory.findMany({
      where: { userId: req.user.id }
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const createIncomeCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const category = await prisma.incomeCategory.create({
      data: {
        name,
        userId: req.user.id
      }
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const updateIncomeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCategory = await prisma.incomeCategory.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่นี้' });
    }

    const category = await prisma.incomeCategory.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteIncomeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.incomeCategory.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่นี้' });
    }

    await prisma.incomeCategory.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) {
    next(err);
  }
};
