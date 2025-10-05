import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { deleteFile } from '@/app/lib/upload'

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
async function deleteInvoice(
  request: AuthenticatedRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // First, get the invoice to retrieve file information
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Delete the physical file
    const deleteResult = await deleteFile(invoice.fileName)
    
    if (!deleteResult.success) {
      console.warn(`Failed to delete file ${invoice.fileName}:`, deleteResult.error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete the invoice from database
    await prisma.invoice.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
      data: {
        deletedInvoice: {
          id: invoice.id,
          clientName: invoice.clientName,
          amount: invoice.amount,
          fileName: invoice.fileName
        }
      }
    })
  } catch (error) {
    console.error('Delete invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}

// GET /api/invoices/[id] - Get a specific invoice
async function getInvoice(
  request: AuthenticatedRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export const GET = adminOnly(getInvoice)
export const DELETE = adminOnly(deleteInvoice)
