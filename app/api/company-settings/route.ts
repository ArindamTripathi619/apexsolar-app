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

    // Get existing settings or create new ones using raw queries to bypass TypeScript issues
    console.log('Attempting to find existing company settings...')
    let settings: any
    try {
      // Test database connection first
      await prisma.$connect()
      console.log('Database connected successfully')
      
      // Try to find existing settings with more specific error handling
      console.log('Executing SELECT query on company_settings...')
      const existingSettings = await prisma.$queryRaw`SELECT * FROM company_settings LIMIT 1`
      console.log('SELECT query result:', existingSettings)
      
      settings = Array.isArray(existingSettings) && existingSettings.length > 0 ? existingSettings[0] : null
      console.log('Existing settings found:', !!settings)
    } catch (findError) {
      console.error('Error finding settings - Full details:', {
        message: findError instanceof Error ? findError.message : 'Unknown error',
        stack: findError instanceof Error ? findError.stack : undefined,
        code: (findError as any)?.code,
        errno: (findError as any)?.errno,
        sqlMessage: (findError as any)?.sqlMessage,
        sqlState: (findError as any)?.sqlState,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed', 
          details: findError instanceof Error ? findError.message : 'Unknown error',
          code: (findError as any)?.code 
        },
        { status: 500 }
      )
    }
    
    if (settings) {
      console.log('Updating existing settings...')
      try {
        await prisma.$executeRaw`
          UPDATE company_settings 
          SET 
            "accountName" = ${accountName},
            "bankName" = ${bankName},
            "ifscCode" = ${ifscCode},
            "accountNumber" = ${accountNumber},
            "gstNumber" = ${gstNumber},
            "stampSignatureUrl" = ${stampSignatureUrl || null},
            "companyLogoUrl" = ${companyLogoUrl || null},
            "updatedAt" = NOW()
          WHERE id = ${settings.id}
        `
        
        // Fetch updated settings
        const updatedSettings = await prisma.$queryRaw`SELECT * FROM company_settings WHERE id = ${settings.id}`
        settings = Array.isArray(updatedSettings) && updatedSettings.length > 0 ? updatedSettings[0] : settings
        console.log('Settings updated successfully')
      } catch (updateError) {
        console.error('Error updating settings:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update settings', details: updateError instanceof Error ? updateError.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else {
      console.log('Creating new settings...')
      try {
        await prisma.$executeRaw`
          INSERT INTO company_settings ("accountName", "bankName", "ifscCode", "accountNumber", "gstNumber", "stampSignatureUrl", "companyLogoUrl", "createdAt", "updatedAt")
          VALUES (${accountName}, ${bankName}, ${ifscCode}, ${accountNumber}, ${gstNumber}, ${stampSignatureUrl || null}, ${companyLogoUrl || null}, NOW(), NOW())
        `
        
        // Fetch created settings
        const newSettings = await prisma.$queryRaw`SELECT * FROM company_settings ORDER BY "createdAt" DESC LIMIT 1`
        settings = Array.isArray(newSettings) && newSettings.length > 0 ? newSettings[0] : null
        console.log('Settings created successfully')
      } catch (createError) {
        console.error('Error creating settings:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create settings', details: createError instanceof Error ? createError.message : 'Unknown error' },
          { status: 500 }
        )
      }
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
