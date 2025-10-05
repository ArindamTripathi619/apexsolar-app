import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { z } from 'zod'
import { deleteFile, extractFileNameFromUrl } from '@/app/lib/upload'

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  dateOfJoining: z.string().optional()
})

// GET /api/employees/[id] - Get single employee
async function getEmployee(request: AuthenticatedRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        documents: true,
        payments: {
          orderBy: { date: 'desc' }
        },
        attendance: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }]
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Get employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Update employee
async function updateEmployee(request: AuthenticatedRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const body = await request.json()
    const data = updateEmployeeSchema.parse(body)

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined
      },
      include: {
        documents: true,
        payments: {
          orderBy: { date: 'desc' }
        },
        attendance: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }]
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Delete employee
async function deleteEmployee(request: AuthenticatedRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params

    // Check if employee exists and get their documents
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        documents: true,
        payments: true,
        attendance: true
      }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Delete employee and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the employee (cascade will handle related database records)
      await tx.employee.delete({
        where: { id }
      })
    })

    // Delete associated files after successful database deletion
    const fileDeletionPromises = []

    // Delete profile photo if exists
    if (existingEmployee.profilePhotoUrl) {
      const fileName = extractFileNameFromUrl(existingEmployee.profilePhotoUrl)
      fileDeletionPromises.push(
        deleteFile(fileName).catch(error => 
          console.error(`Failed to delete profile photo ${fileName}:`, error)
        )
      )
    }

    // Delete all document files
    for (const document of existingEmployee.documents) {
      const fileName = extractFileNameFromUrl(document.fileUrl)
      fileDeletionPromises.push(
        deleteFile(fileName).catch(error => 
          console.error(`Failed to delete document ${fileName}:`, error)
        )
      )
    }

    // Execute all file deletions (don't block the response on these)
    if (fileDeletionPromises.length > 0) {
      console.log(`Initiating cleanup of ${fileDeletionPromises.length} files for employee ${existingEmployee.name}`)
      Promise.all(fileDeletionPromises).then(() => {
        console.log(`Successfully cleaned up ${fileDeletionPromises.length} files for employee ${existingEmployee.name}`)
      }).catch(error => {
        console.error(`Some files failed to delete for employee ${existingEmployee.name}:`, error)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

export const GET = adminOnly(getEmployee)
export const PUT = adminOnly(updateEmployee)
export const DELETE = adminOnly(deleteEmployee)
