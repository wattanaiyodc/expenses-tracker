import { prisma } from '../prismaClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/token.js';

// 🎯 สร้าง Income Categories อัตโนมัติสำหรับ user ใหม่
async function createDefaultIncomeCategoriesForUser(userId) {
  const defaultCategories = [
    '💰 เงินเดือนหลัก',
    '🎯 โบนัส', 
    '⏰ ค่าล่วงเวลา',
    '💼 งานพาร์ทไทม์',
    '🛒 ขายของออนไลน์',
    '📈 เงินปันผล',
    '🏦 ดอกเบี้ย',
    '🎁 เงินขวัญ',
    '💸 อื่นๆ'
  ];

  // สร้างหมวดหมู่รายได้ default สำหรับ user ใหม่
  await Promise.all(
    defaultCategories.map(name => 
      prisma.incomeCategory.create({
        data: { name, userId }
      })
    )
  );
}

// 🆕 สร้าง Expense Categories อัตโนมัติ (global - ครั้งเดียวพอ)
async function createDefaultExpenseCategoriesIfNotExist() {
  const defaultCategories = [
    { name: '🍽️ อาหารและเครื่องดื่ม', description: 'ค่าอาหาร เครื่องดื่ม ร้านอาหาร' },
    { name: '🚗 การเดินทาง', description: 'ค่าน้ำมัน ค่าโดยสาร แท็กซี่ รถไฟ' },
    { name: '🛍️ ช็อปปิ้ง', description: 'เสื้อผ้า รองเท้า เครื่องใช้ส่วนตัว' },
    { name: '🎬 บันเทิง', description: 'หนัง คอนเสิร์ต เกม งานอดิเรก' },
    { name: '🏥 สุขภาพ', description: 'โรงพยาบาล คลินิก ยา วิตามิน' },
    { name: '📚 การศึกษา', description: 'หนังสือ คอร์สเรียน อบรม สัมมนา' },
    { name: '🏠 บ้านและสวน', description: 'ค่าไฟ ค่าน้ำ อินเทอร์เน็ต ของใช้ในบ้าน' },
    { name: '💸 อื่นๆ', description: 'รายจ่ายอื่นๆ ที่ไม่อยู่ในหมวดใดๆ' }
  ];

  // ตรวจสอบว่ามี categories อยู่แล้วหรือไม่
  const existingCount = await prisma.category.count();
  
  if (existingCount === 0) {
    // ถ้ายังไม่มี categories ให้สร้างใหม่
    await Promise.all(
      defaultCategories.map(category => 
        prisma.category.create({
          data: category
        })
      )
    );
    console.log(`✅ สร้าง default expense categories จำนวน ${defaultCategories.length} หมวด`);
  }
}

export const register = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ 
        message: '❌ กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: '❌ รูปแบบอีเมลไม่ถูกต้อง' 
      });
    }

    // ตรวจสอบความแข็งแรงของรหัสผ่าน
    if (password.length < 6) {
      return res.status(400).json({ 
        message: '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' 
      });
    }

    const hashed = await hashPassword(password);
    
    // 🚀 สร้าง default expense categories ถ้ายังไม่มี (ต้องทำก่อนสร้าง user)
    await createDefaultExpenseCategoriesIfNotExist();
    
    // สร้าง user ใหม่
    const user = await prisma.user.create({
      data: { 
        firstname: firstname.trim(), 
        lastname: lastname.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashed 
      }
    });

    // 🚀 สร้าง Income Categories อัตโนมัติ
    await createDefaultIncomeCategoriesForUser(user.id);

    res.status(201).json({
      message: '✅ สมัครสมาชิกสำเร็จ! หมวดหมู่รายได้และรายจ่ายได้ถูกสร้างให้แล้ว',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email
      }
    });

  } catch (err) {
    // ตรวจสอบ unique constraint error (อีเมลซ้ำ)
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        message: '❌ อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' 
      });
    }
    
    console.error('Registration error:', err);
    next(err);
  }
};

export const getUserbyId = async (req, res, next) => {
  try {
    // ดึง user id จาก token ที่ decode แล้วใน middleware
    const userId = req.user.id;
        
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        createdAt: true
        // ไม่ส่ง password กลับไป
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: '❌ ไม่พบข้อมูลผู้ใช้' 
      });
    }

    res.json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      createdAt: user.createdAt
    });

  } catch (err) {
    console.error('Get user error:', err);
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !password) {
      return res.status(400).json({ 
        message: '❌ กรุณากรอกอีเมลและรหัสผ่าน' 
      });
    }

    // ค้นหา user และนับจำนวน categories ด้วย
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() },
      include: {
        _count: {
          select: {
            expenses: true,
            incomes: true,
            incomeCategories: true
          }
        }
      }
    });
            
    if (!user) {
      return res.status(401).json({ 
        message: '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
      });
    }
            
    // ตรวจสอบรหัสผ่าน
    let isPasswordValid;
    if (user.password.startsWith('$2')) {
      // Password ถูก hash แล้ว ใช้ bcrypt compare
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      // Password ไม่ได้ hash เปรียบเทียบโดยตรง (legacy support)
      isPasswordValid = password === user.password;
      
      // ถ้า password ตรงแต่ไม่ได้ hash ให้ hash ใหม่
      if (isPasswordValid) {
        const hashedPassword = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
      }
    }
            
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    res.json({
      message: '✅ เข้าสู่ระบบสำเร็จ',
      token: generateToken(user.id),
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        stats: {
          totalExpenses: user._count.expenses,
          totalIncomes: user._count.incomes,
          incomeCategories: user._count.incomeCategories
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

// 🆕 API สำหรับดู Categories ทั้งหมดของ User
export const getUserCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Expense Categories (global - ทุกคนใช้เดียวกัน)
    const expenseCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    // Income Categories (user-specific)  
    const incomeCategories = await prisma.incomeCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    res.json({
      expenseCategories,
      incomeCategories,
      message: `📊 พบหมวดรายจ่าย ${expenseCategories.length} หมวด และหมวดรายได้ ${incomeCategories.length} หมวด`
    });

  } catch (err) {
    console.error('Get categories error:', err);
    next(err);
  }
};