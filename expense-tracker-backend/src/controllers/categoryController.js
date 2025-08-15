import { prisma } from '../prismaClient.js';

// ดึงรายการ category ทั้งหมด
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// สร้าง category ใหม่
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description }
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

// แก้ไข category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params; // ต้องส่ง id ใน route
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, description }
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
};

// ลบ category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Deleted successfully", category });
  } catch (err) {
    next(err);
  }
};
