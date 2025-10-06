import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '../../../lib/auth'

async function authenticateRequest(request: NextRequest) {
  // Try to get token from cookies first
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyToken(token)
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause for filtering
    const whereClause: any = {}
    
    if (clientName) {
      whereClause.clientName = {
        contains: clientName,
        mode: 'insensitive'
      }
    }
    
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    // Get all invoices matching the filter
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            payments: true
          }
        }
      }
    })

    // Calculate statistics
    let totalInvoiceAmount = 0
    let totalPaidAmount = 0
    let totalDueAmount = 0

    // Group invoices by client to calculate due amounts properly
    const clientGroups = new Map()

    for (const invoice of invoices) {
      totalInvoiceAmount += invoice.amount

      if (invoice.client) {
        if (!clientGroups.has(invoice.client.id)) {
          clientGroups.set(invoice.client.id, {
            totalInvoices: 0,
            totalPayments: 0
          })
        }

        const group = clientGroups.get(invoice.client.id)
        group.totalInvoices += invoice.amount
        
        // Add payments for this client (only count each payment once)
        if (group.totalPayments === 0) {
          group.totalPayments = invoice.client.payments.reduce((sum, payment) => sum + payment.amount, 0)
        }
      }
    }

    // Calculate total paid and due amounts
    for (const [clientId, group] of clientGroups) {
      totalPaidAmount += group.totalPayments
      totalDueAmount += Math.max(0, group.totalInvoices - group.totalPayments)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalInvoiceAmount,
        totalPaidAmount,
        totalDueAmount,
        invoiceCount: invoices.length
      }
    })
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
