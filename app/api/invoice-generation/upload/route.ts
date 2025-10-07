import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string

    if (!file || !invoiceId) {
      return NextResponse.json(
        { success: false, error: 'File and invoice ID are required' },
        { status: 400 }
      )
    }

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Create filename based on invoice number or ID
    const fileExtension = path.extname(file.name)
    const fileName = `invoice_${invoice.id}${fileExtension}`

    // Save file to uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices')
    const filePath = path.join(uploadsDir, fileName)

    // Create directory if it doesn't exist
    await writeFile(filePath, buffer)

    // Update invoice with file path
    const fileUrl = `/uploads/invoices/${fileName}`
    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        fileName,
        fileUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        fileUrl
      }
    })
  } catch (error) {
    console.error('Error uploading invoice PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload invoice PDF' },
      { status: 500 }
    )
  }
}
