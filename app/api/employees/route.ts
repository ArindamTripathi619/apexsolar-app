import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const createEmployeeSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  dateOfJoining: z.string().optional()
})

// GET /api/employees - Get all employees
async function getEmployees(_request: AuthenticatedRequest) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        documents: true,
        payments: {
          orderBy: { date: 'desc' }
        },
        attendance: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }]
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: employees
    })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee
async function createEmployee(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const data = createEmployeeSchema.parse(body)

    const employee = await prisma.employee.create({
      data: {
        ...data,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
        uniqueSlug: uuidv4()
      },
      include: {
        documents: true,
        payments: true,
        attendance: true
      }
    })

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}

// Middleware that allows both admin and accountant for GET, admin only for POST
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

export const GET = adminOrAccountantOnly(getEmployees)
export const POST = adminOnly(createEmployee)
