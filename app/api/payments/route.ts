import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { z } from 'zod'
import { PaymentType } from '@prisma/client'

const createPaymentSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['DUE', 'ADVANCE', 'DUE_CLEARED', 'ADVANCE_REPAID']),
  amount: z.number().positive(),
  description: z.string().optional().or(z.literal('').transform(() => undefined)),
  date: z.string(),
  clearedPaymentId: z.string().optional()
})

// GET /api/payments - Get payments by employee
async function getPayments(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    const whereClause = employeeId ? { employeeId } : {}

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true
          }
        },
        clearingPayments: true  // Include payments that clear this payment
      },
      orderBy: { date: 'desc' }
    })

    // Add isCleared status to each payment
    const paymentsWithStatus = payments.map(payment => ({
      ...payment,
      isCleared: payment.clearingPayments.length > 0
    }))

    return NextResponse.json({
      success: true,
      data: paymentsWithStatus
    })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create new payment
async function createPayment(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const data = createPaymentSchema.parse(body)

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        employeeId: data.employeeId,
        type: data.type as PaymentType,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date)
      },
      include: {
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments - Delete payment
async function deletePayment(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Verify payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}

export const GET = adminOnly(getPayments)
export const POST = adminOnly(createPayment)
export const DELETE = adminOnly(deletePayment)
