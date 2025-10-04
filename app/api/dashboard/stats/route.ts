import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'

// GET /api/dashboard/stats - Get dashboard statistics
async function getDashboardStats(_request: AuthenticatedRequest) {
  try {
    // Get counts with better error handling
    const [
      totalEmployees,
      totalDocuments,
      totalPayments,
      totalInvoices,
      recentPayments,
      thisMonthAttendance
    ] = await Promise.all([
      // Total employees
      prisma.employee.count(),
      
      // Total documents
      prisma.employeeDocument.count(),
      
      // Total payments this month
      prisma.payment.count({
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Total invoices
      prisma.invoice.count(),
      
      // Recent payments (last 5)
      prisma.payment.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: { name: true }
          }
        }
      }),
      
      // This month's attendance count
      prisma.attendance.count({
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      })
    ])

    // Calculate total payment amounts
    const paymentSums = await prisma.payment.groupBy({
      by: ['type'],
      _sum: {
        amount: true
      }
    })

    const totalDues = paymentSums.find(p => p.type === 'DUE')?._sum.amount || 0
    const totalAdvances = paymentSums.find(p => p.type === 'ADVANCE')?._sum.amount || 0

    // Calculate total invoice amount
    const invoiceSum = await prisma.invoice.aggregate({
      _sum: {
        amount: true
      }
    })

    const totalInvoiceAmount = invoiceSum._sum.amount || 0

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        totalDocuments,
        totalPayments,
        totalInvoices,
        totalDues,
        totalAdvances,
        totalInvoiceAmount,
        thisMonthAttendance,
        recentPayments
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

export const GET = adminOnly(getDashboardStats)
