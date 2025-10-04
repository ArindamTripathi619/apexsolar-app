import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, adminOrAccountant, AuthenticatedRequest } from '@/app/lib/middleware'
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
async function getEmployees(request: AuthenticatedRequest) {
  try {
    // Log user info for debugging
    console.log('User info:', request.user);
    
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
export const GET = adminOrAccountant(getEmployees)
export const POST = adminOnly(createEmployee)