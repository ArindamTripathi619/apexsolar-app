import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { hashPassword } from '@/app/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if this is authorized (basic security)
    const { password } = await request.json()
    if (password !== 'InitializeApexSolar2024!') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123')
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@apexsolar.net' },
      update: {},
      create: {
        email: 'admin@apexsolar.net',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // Create accountant user
    const hashedAccountantPassword = await hashPassword('accountant123')
    
    const accountant = await prisma.user.upsert({
      where: { email: 'accountant@apexsolar.net' },
      update: {},
      create: {
        email: 'accountant@apexsolar.net',
        password: hashedAccountantPassword,
        role: 'ACCOUNTANT',
      },
    })

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      users: [
        { email: admin.email, role: admin.role },
        { email: accountant.email, role: accountant.role }
      ]
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}