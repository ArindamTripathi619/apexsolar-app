import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOrAccountant, AuthenticatedRequest } from '@/app/lib/middleware'
import { z } from 'zod'

const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  daysWorked: z.number().min(0).max(31)
})

// GET /api/attendance - Get attendance records
async function getAttendance(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const whereClause: any = {}
    
    if (employeeId) {
      whereClause.employeeId = employeeId
    }
    
    if (month) {
      whereClause.month = parseInt(month)
    }
    
    if (year) {
      whereClause.year = parseInt(year)
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Create or update attendance record
async function createAttendance(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const data = createAttendanceSchema.parse(body)

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if attendance record already exists for this month/year
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: data.employeeId,
          month: data.month,
          year: data.year
        }
      }
    })

    let attendance
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          daysWorked: data.daysWorked
        },
        include: {
          employee: {
            select: {
              name: true
            }
          }
        }
      })
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          employeeId: data.employeeId,
          month: data.month,
          year: data.year,
          daysWorked: data.daysWorked
        },
        include: {
          employee: {
            select: {
              name: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    console.error('Create attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}

// Use standard middleware that supports Bearer tokens
export const GET = adminOrAccountant(getAttendance)
export const POST = adminOrAccountant(createAttendance)
