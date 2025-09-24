import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'

// Middleware that allows both admin and accountant
const adminOrAccountantOnly = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (request: NextRequest) => {
    try {
      const response = await fetch(new URL('/api/auth/me', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      })
      
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      const data = await response.json()
      if (!data.success || (data.data.role !== 'ADMIN' && data.data.role !== 'ACCOUNTANT')) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest  
      authenticatedRequest.user = data.data
      
      return handler(authenticatedRequest)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}
import { uploadFile } from '@/app/lib/upload'
import { ChallanType } from '@prisma/client'

// GET /api/challans - Get all PF/ESI challans
async function getChallans(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type')

    const whereClause: any = {}
    
    if (month) {
      whereClause.month = parseInt(month)
    }
    
    if (year) {
      whereClause.year = parseInt(year)
    }
    
    if (type && (type === 'PF' || type === 'ESI')) {
      whereClause.type = type as ChallanType
    }

    const challans = await prisma.pfEsiChallan.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { type: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: challans
    })
  } catch (error) {
    console.error('Get challans error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challans' },
      { status: 500 }
    )
  }
}

// POST /api/challans - Upload new PF/ESI challan
async function uploadChallan(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)
    const type = formData.get('type') as ChallanType

    if (!file || !month || !year || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type (only PDF for challans)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed for challans' },
        { status: 400 }
      )
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid month' },
        { status: 400 }
      )
    }

    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { success: false, error: 'Invalid year' },
        { status: 400 }
      )
    }

    // Check if challan already exists for this month/year/type
    const existingChallan = await prisma.pfEsiChallan.findFirst({
      where: {
        month,
        year,
        type
      }
    })

    // Upload file
    const uploadResult = await uploadFile(
      file,
      `challans/${type.toLowerCase()}`,
      ['application/pdf']
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      )
    }

    let challan
    if (existingChallan) {
      // Update existing challan
      challan = await prisma.pfEsiChallan.update({
        where: { id: existingChallan.id },
        data: {
          fileName: uploadResult.fileName!,
          fileUrl: uploadResult.fileUrl!,
          uploadedBy: request.user.id,
          uploadedAt: new Date()
        }
      })
    } else {
      // Create new challan
      challan = await prisma.pfEsiChallan.create({
        data: {
          month,
          year,
          type,
          fileName: uploadResult.fileName!,
          fileUrl: uploadResult.fileUrl!,
          uploadedBy: request.user.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: challan
    })
  } catch (error) {
    console.error('Upload challan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload challan' },
      { status: 500 }
    )
  }
}

export const GET = adminOrAccountantOnly(getChallans)
export const POST = adminOrAccountantOnly(uploadChallan)
