import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { uploadToGCS, getPublicUrl } from '@/app/lib/gcs'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting PDF upload process with GCS...')
    console.log('🌍 Environment:', process.env.NODE_ENV)
    console.log('☁️ GCS Project:', process.env.GOOGLE_CLOUD_PROJECT_ID)
    console.log('🪣 GCS Bucket:', process.env.GCS_BUCKET_NAME)
    
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

    // Create filename for GCS storage
    const fileExtension = file.name.split('.').pop() || 'pdf'
    const fileName = `invoices/invoice_${invoice.id}.${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('☁️ Uploading to GCS...')
    console.log('📁 GCS file path:', fileName)

    try {
      // Upload to Google Cloud Storage
      await uploadToGCS(buffer, fileName, file.type || 'application/pdf')
      console.log('✅ File uploaded to GCS successfully')

      // Get public URL
      const publicUrl = getPublicUrl(fileName)
      console.log('🔗 Public URL:', publicUrl)

      // Update invoice with file path
      console.log('🔄 Updating invoice record...')
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          fileName: fileName.split('/').pop() || fileName,
          fileUrl: publicUrl
        }
      })

      console.log('✅ Upload completed successfully')
      return NextResponse.json({
        success: true,
        data: {
          fileName: fileName.split('/').pop() || fileName,
          fileUrl: publicUrl
        }
      })
    } catch (gcsError) {
      console.error('☁️ GCS upload failed:', gcsError)
      
      return NextResponse.json(
        { success: false, error: `Failed to upload to cloud storage: ${gcsError instanceof Error ? gcsError.message : 'Unknown GCS error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('💥 Error uploading invoice PDF:', error)
    
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
