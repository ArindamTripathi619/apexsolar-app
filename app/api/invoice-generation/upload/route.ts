import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting PDF upload process...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string

    console.log('📄 File received:', file?.name, 'Size:', file?.size)
    console.log('🆔 Invoice ID:', invoiceId)

    if (!file || !invoiceId) {
      console.error('❌ Missing file or invoice ID')
      return NextResponse.json(
        { success: false, error: 'File and invoice ID are required' },
        { status: 400 }
      )
    }

    // Verify invoice exists
    console.log('🔍 Verifying invoice exists...')
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      console.error('❌ Invoice not found in database')
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    console.log('✅ Invoice found:', invoice.id)

    // Create filename based on invoice number or ID
    const fileExtension = path.extname(file.name)
    const fileName = `invoice_${invoice.id}${fileExtension}`

    // Save file to uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices')
    const filePath = path.join(uploadsDir, fileName)

    console.log('📁 Upload directory:', uploadsDir)
    console.log('📄 File path:', filePath)

    // Create directory if it doesn't exist
    console.log('🏗️ Ensuring directory exists...')
    await mkdir(uploadsDir, { recursive: true })
    
    console.log('💾 Writing file to disk...')
    await writeFile(filePath, buffer)

    // Update invoice with file path
    const fileUrl = `/uploads/invoices/${fileName}`
    
    console.log('🔄 Updating invoice record...')
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        fileName,
        fileUrl
      }
    })

    console.log('✅ Upload completed successfully')
    return NextResponse.json({
      success: true,
      data: {
        fileName,
        fileUrl
      }
    })
  } catch (error) {
    console.error('💥 Error uploading invoice PDF:', error)
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to upload invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
