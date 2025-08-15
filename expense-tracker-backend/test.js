import { prisma } from './src/prismaClient.js';

async function main() {
  // สร้าง user ตัวอย่าง
   const category = await prisma.category.create({
    data: {
      name: "snack",
      description: "Daily meals"
    }
  });
  
  console.log("Created category:", category);

  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "admin@example.com",
      password: "123456",
    },
  });

  console.log("Created user:", user);

  // สร้าง expense ตัวอย่าง
  const expense = await prisma.expense.create({
    data: {
      amount: 150,
      note: "Lunch",
      userId: user.id,
      categoryId: category.id 
    },
  });

  console.log("Created expense:", expense);

 

  // อ่านข้อมูล
  const allUsers = await prisma.user.findMany({ include: { expenses: true } });
  console.log("All users with expenses:", allUsers);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
