import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../../../../lib/auth'

const prisma = new PrismaClient()

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params
    const body = await request.json()
    const { amount, description, date } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Payment date is required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const payment = await prisma.clientPayment.create({
      data: {
        clientId,
        amount: parseFloat(amount),
        description: description || null,
        date: new Date(date)
      }
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params

    const payments = await prisma.clientPayment.findMany({
      where: { clientId },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
