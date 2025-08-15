import { prisma } from './src/prismaClient.js';

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log('All users:', users);
  
  // ตรวจสอบ user ที่ต้องการ login
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });
  console.log('Specific user:', user);
}

checkUsers();