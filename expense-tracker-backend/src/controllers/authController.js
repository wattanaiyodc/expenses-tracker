import { prisma } from '../prismaClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/token.js';


export const register = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { firstname, lastname, email, password: hashed }
    });
    res.json({ id: user.id, firstname: user.firstname, lastname: user.lastname, 
               email: user.email });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // ตรวจสอบว่า password ถูก hash หรือไม่
    let isPasswordValid;
    if (user.password.startsWith('$2')) {
      // Password ถูก hash แล้ว ใช้ bcrypt compare
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      // Password ไม่ได้ hash เปรียบเทียบโดยตรง
      isPasswordValid = password === user.password;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({
      token: generateToken(user.id),
      user: { id: user.id, name: user.firstname, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};