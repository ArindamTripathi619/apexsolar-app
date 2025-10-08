import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import { constants } from 'fs'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting PDF upload process...')
    console.log('🌍 Environment:', process.env.NODE_ENV)
    console.log('📁 Working directory:', process.cwd())
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string

    console.log('📄 File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type)
    console.log('🆔 Invoice ID:', invoiceId)

    if (!file || !invoiceId) {
      console.error('❌ Missing file or invoice ID')
      return NextResponse.json(
        { success: false, error: 'File and invoice ID are required' },
        { status: 400 }
      )
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large:', file.size)
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 10MB allowed.' },
        { status: 413 }
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

    // Check if uploads directory exists, if not create it
    try {
      await access(uploadsDir, constants.F_OK)
      console.log('✅ Upload directory exists')
    } catch {
      console.log('🏗️ Creating upload directory...')
      await mkdir(uploadsDir, { recursive: true })
      console.log('✅ Upload directory created')
    }

    // Check write permissions
    try {
      await access(uploadsDir, constants.W_OK)
      console.log('✅ Upload directory is writable')
    } catch (error) {
      console.error('❌ Upload directory is not writable:', error)
      return NextResponse.json(
        { success: false, error: 'Upload directory is not writable' },
        { status: 500 }
      )
    }
    
    console.log('💾 Writing file to disk...')
    await writeFile(filePath, buffer)
    console.log('✅ File written successfully')

    // Verify file was written
    try {
      await access(filePath, constants.F_OK)
      console.log('✅ File exists after write')
    } catch (error) {
      console.error('❌ File does not exist after write:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to verify file write' },
        { status: 500 }
      )
    }

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
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to upload invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
