import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@apexsolar.net'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN
      }
    })

    console.log(`✅ Created admin user: ${admin.email}`)
  } else {
    console.log(`ℹ️  Admin user already exists: ${existingAdmin.email}`)
  }

  // Create accountant user
  const accountantEmail = 'accountant@apexsolar.net'
  const accountantPassword = 'accountant123'

  const existingAccountant = await prisma.user.findUnique({
    where: { email: accountantEmail }
  })

  if (!existingAccountant) {
    const hashedPassword = await bcrypt.hash(accountantPassword, 12)
    
    const accountant = await prisma.user.create({
      data: {
        email: accountantEmail,
        password: hashedPassword,
        role: UserRole.ACCOUNTANT
      }
    })

    console.log(`✅ Created accountant user: ${accountant.email}`)
  } else {
    console.log(`ℹ️  Accountant user already exists: ${existingAccountant.email}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
