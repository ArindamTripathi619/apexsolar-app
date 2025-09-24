import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { z } from 'zod'
import { PaymentType } from '@prisma/client'

const clearPaymentSchema = z.object({
  paymentId: z.string().min(1),
  description: z.string().optional()
})

// POST /api/payments/clear - Clear a payment (DUE or ADVANCE)
async function clearPayment(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const data = clearPaymentSchema.parse(body)

    // Get the original payment
    const originalPayment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    if (!originalPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment can be cleared (only DUE and ADVANCE can be cleared)
    if (originalPayment.type !== 'DUE' && originalPayment.type !== 'ADVANCE') {
      return NextResponse.json(
        { success: false, error: 'Only DUE and ADVANCE payments can be cleared' },
        { status: 400 }
      )
    }

    // Check if payment is already cleared
    const existingClearance = await prisma.payment.findFirst({
      where: { 
        clearedPaymentId: data.paymentId 
      }
    })

    if (existingClearance) {
      return NextResponse.json(
        { success: false, error: 'Payment has already been cleared' },
        { status: 400 }
      )
    }

    // Determine the clearing payment type
    const clearingType: PaymentType = originalPayment.type === 'DUE' ? 'DUE_CLEARED' : 'ADVANCE_REPAID'
    
    // Create clearing payment
    const clearingPayment = await prisma.payment.create({
      data: {
        employeeId: originalPayment.employeeId,
        type: clearingType,
        amount: originalPayment.amount,
        description: data.description || `Clearing ${originalPayment.type.toLowerCase()} payment from ${originalPayment.date.toLocaleDateString()}`,
        date: new Date(),
        clearedPaymentId: originalPayment.id
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
      data: clearingPayment,
      message: `${originalPayment.type} payment cleared successfully`
    })
  } catch (error) {
    console.error('Clear payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear payment' },
      { status: 500 }
    )
  }
}

export const POST = adminOnly(clearPayment)
