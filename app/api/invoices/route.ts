import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { uploadFile, ALLOWED_FILE_TYPES, deleteFile } from '@/app/lib/upload'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  amount: z.number().positive(),
  date: z.string()
})

// GET /api/invoices - Get all invoices
async function getInvoices(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: invoices
    })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Upload new invoice
async function uploadInvoice(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientName = formData.get('clientName') as string
    const clientId = formData.get('clientId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const date = formData.get('date') as string

    if (!file || !clientName || !clientId || !amount || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type (only PDF for invoices)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed for invoices' },
        { status: 400 }
      )
    }

    // Upload file
    const uploadResult = await uploadFile(
      file,
      'invoices',
      ['application/pdf']
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      )
    }

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        clientName,
        clientId,
        amount,
        date: new Date(date),
        fileName: uploadResult.fileName!,
        fileUrl: uploadResult.fileUrl!
      }
    })

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Upload invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload invoice' },
      { status: 500 }
    )
  }
}

export const GET = adminOnly(getInvoices)
export const POST = adminOnly(uploadInvoice)
