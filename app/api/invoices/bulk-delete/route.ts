import { NextResponse } from 'next/server'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function handleBulkDelete(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { invoiceIds } = body

    // Validate input
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice IDs array is required' 
      }, { status: 400 })
    }

    // Validate all IDs are strings
    if (!invoiceIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
      return NextResponse.json({ 
        success: false, 
        error: 'All invoice IDs must be valid strings' 
      }, { status: 400 })
    }

    // Delete invoices in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, get the invoices that will be deleted for logging
      const invoicesToDelete = await tx.invoice.findMany({
        where: {
          id: {
            in: invoiceIds
          }
        },
        select: {
          id: true,
          clientName: true,
          amount: true,
          createdAt: true
        }
      })

      // Delete the invoices
      const deleteResult = await tx.invoice.deleteMany({
        where: {
          id: {
            in: invoiceIds
          }
        }
      })

      return {
        deletedCount: deleteResult.count,
        deletedInvoices: invoicesToDelete
      }
    })

    console.log(`Bulk deleted ${result.deletedCount} invoices:`, result.deletedInvoices.map(inv => `${inv.clientName} - $${inv.amount}`))

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} invoices`
    })

  } catch (error) {
    console.error('Bulk delete invoices error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete invoices'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export const POST = adminOnly(handleBulkDelete)
