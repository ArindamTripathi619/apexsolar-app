import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

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
  try {
    const body = await request.json()
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
    let settings = await prisma.companySettings.findFirst()
    
    if (settings) {
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
    } else {
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
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update company settings' },
      { status: 500 }
    )
  }
}
