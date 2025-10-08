import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly } from '@/app/lib/middleware'

export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst()
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          accountName: "APEX SOLAR",
          bankName: "STATE BANK OF INDIA", 
          ifscCode: "SBIN0007679",
          accountNumber: "40423372674",
          gstNumber: "19AFZPT2526E1ZV"
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  console.log('Company settings PUT request started - TEMPORARY DEBUG MODE')
  
  try {
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    })

    const body = await request.json()
    console.log('Request body received:', {
      hasAccountName: !!body.accountName,
      hasBankName: !!body.bankName,
      hasIfscCode: !!body.ifscCode,
      hasAccountNumber: !!body.accountNumber,
      hasGstNumber: !!body.gstNumber,
      hasStampSignature: !!body.stampSignatureUrl,
      hasCompanyLogo: !!body.companyLogoUrl,
      stampSignatureSize: body.stampSignatureUrl ? body.stampSignatureUrl.length : 0,
      companyLogoSize: body.companyLogoUrl ? body.companyLogoUrl.length : 0
    })

    const { 
      accountName, 
      bankName, 
      ifscCode, 
      accountNumber, 
      gstNumber, 
      stampSignatureUrl,
      companyLogoUrl 
    } = body

    // Validate required fields
    if (!accountName || !bankName || !ifscCode || !accountNumber || !gstNumber) {
      console.error('Missing required fields:', { accountName, bankName, ifscCode, accountNumber, gstNumber })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file sizes (base64 strings can be very large)
    if (stampSignatureUrl && stampSignatureUrl.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, error: 'Stamp/signature image is too large (max 10MB)' },
        { status: 400 }
      )
    }

    if (companyLogoUrl && companyLogoUrl.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, error: 'Company logo is too large (max 10MB)' },
        { status: 400 }
      )
    }

    console.log('Updating company settings with data:', {
      accountName,
      bankName,
      ifscCode,
      accountNumber,
      gstNumber,
      hasStampSignature: !!stampSignatureUrl,
      hasCompanyLogo: !!companyLogoUrl,
      stampSignatureSize: stampSignatureUrl ? stampSignatureUrl.length : 0,
      companyLogoSize: companyLogoUrl ? companyLogoUrl.length : 0
    })

    // Get existing settings or create new ones
    console.log('Attempting to find existing company settings...')
    let settings = await prisma.companySettings.findFirst()
    console.log('Existing settings found:', !!settings)
    
    if (settings) {
      console.log('Updating existing settings...')
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          accountName,
          bankName,
          ifscCode,
          accountNumber,
          gstNumber,
          stampSignatureUrl,
          companyLogoUrl
        }
      })
      console.log('Settings updated successfully')
    } else {
      console.log('Creating new settings...')
      settings = await prisma.companySettings.create({
        data: {
          accountName,
          bankName,
          ifscCode,
          accountNumber,
          gstNumber,
          stampSignatureUrl,
          companyLogoUrl
        }
      })
      console.log('Settings created successfully')
    }

    console.log('Company settings operation completed successfully')
    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error updating company settings:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { success: false, error: 'Failed to update company settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
