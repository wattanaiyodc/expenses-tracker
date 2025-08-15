// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding default data for family use...')

  // 🍽️ Global Expense Categories (ทุกคนใช้ร่วมกัน)
  const expenseCategories = [
    { name: '🍽️ อาหารและเครื่องดื่ม', description: 'ค่าอาหาร เครื่องดื่ม ขนม กาแฟ' },
    { name: '🚗 คมนาคม', description: 'ค่าน้ำมัน รถโดยสาร BTS MRT แก็บ กราบ' },
    { name: '🏠 บ้านและที่อยู่', description: 'ค่าเช่า ค่าไฟ ค่าน้ำ ค่าอินเทอร์เน็ต' },
    { name: '💊 สุขภาพ', description: 'ค่าหมอ ยา วิตามิน ประกันสุขภาพ' },
    { name: '👕 เสื้อผ้า', description: 'เสื้อผ้า รองเท้า กระเป๋า เครื่องประดับ' },
    { name: '🎮 ความบันเทิง', description: 'หนัง เกม คอนเสิร์ต ท่องเที่ยว' },
    { name: '📚 การศึกษา', description: 'ค่าเรียน หนังสือ คอร์สออนไลน์' },
    { name: '🛒 ช้อปปิ้ง', description: 'ของใช้ทั่วไป เครื่องใช้ไฟฟ้า' },
    { name: '🎁 ของขวัญ', description: 'ของขวัญวันเกิด วันครบรอบ' },
    { name: '💳 ค่าธรรมเนียม', description: 'ธนาคาร บัตรเครดิต ประกัน' },
    { name: '🔧 ซ่อมแซม', description: 'ซ่อมรถ ซ่อมบ้าน เครื่องใช้' },
    { name: '📱 เทคโนโลยี', description: 'โทรศัพท์ แอป เกม software' },
    { name: '❓ อื่นๆ', description: 'รายจ่ายที่ไม่อยู่ในหมวดอื่น' }
  ]

  console.log('📝 Creating global expense categories...')
  for (const category of expenseCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category
    })
  }

  // 👤 Default Income Categories Template (จะใช้เมื่อสร้าง user ใหม่)
  global.defaultIncomeCategories = [
    '💰 เงินเดือนหลัก',
    '🎯 โบนัส',
    '⏰ ค่าล่วงเวลา', 
    '💼 งานพาร์ทไทม์',
    '🛒 ขายของออนไลน์',
    '📈 เงินปันผล',
    '🏦 ดอกเบี้ย',
    '🎁 เงินขวัญ',
    '💸 อื่นๆ'
  ]

  console.log('✅ Family-friendly setup completed!')
  console.log(`🍽️ Created ${expenseCategories.length} global expense categories`)
  console.log(`💰 Income template ready with ${global.defaultIncomeCategories.length} categories`)
  console.log('🔄 Income categories will auto-create when users register')
}

// 🚀 Helper function for creating default income categories for new users
async function createDefaultIncomeCategoriesForUser(userId) {
  const categories = [
    '💰 เงินเดือนหลัก',
    '🎯 โบนัส', 
    '⏰ ค่าล่วงเวลา',
    '💼 งานพาร์ทไทม์',
    '🛒 ขายของออนไลน์',
    '📈 เงินปันผล',
    '🏦 ดอกเบี้ย',
    '🎁 เงินขวัญ',
    '💸 อื่นๆ'
  ]

  for (const name of categories) {
    await prisma.incomeCategory.create({
      data: { name, userId }
    })
  }
}

// Export helper function
module.exports = { createDefaultIncomeCategoriesForUser }

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })