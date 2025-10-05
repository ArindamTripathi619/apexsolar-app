import { NextResponse } from 'next/server'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { PrismaClient } from '@prisma/client'
import { deleteFile, extractFileNameFromUrl } from '@/app/lib/upload'

const prisma = new PrismaClient()

async function handleBulkDelete(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { employeeIds } = body

    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee IDs array is required' 
      }, { status: 400 })
    }

    // Validate all IDs are strings
    if (!employeeIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
      return NextResponse.json({ 
        success: false, 
        error: 'All employee IDs must be valid strings' 
      }, { status: 400 })
    }

    // Delete employees in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, get the employees that will be deleted for logging and file cleanup
      const employeesToDelete = await tx.employee.findMany({
        where: {
          id: {
            in: employeeIds
          }
        },
        include: {
          documents: true
        }
      })

      // Delete the employees (cascade will handle related database records)
      const deleteResult = await tx.employee.deleteMany({
        where: {
          id: {
            in: employeeIds
          }
        }
      })

      return {
        deletedCount: deleteResult.count,
        deletedEmployees: employeesToDelete
      }
    })

    // Delete associated files after successful database deletion
    const fileDeletionPromises = []

    for (const employee of result.deletedEmployees) {
      // Delete profile photo if exists
      if (employee.profilePhotoUrl) {
        const fileName = extractFileNameFromUrl(employee.profilePhotoUrl)
        fileDeletionPromises.push(
          deleteFile(fileName).catch(error => 
            console.error(`Failed to delete profile photo ${fileName} for ${employee.name}:`, error)
          )
        )
      }

      // Delete all document files
      for (const document of employee.documents) {
        const fileName = extractFileNameFromUrl(document.fileUrl)
        fileDeletionPromises.push(
          deleteFile(fileName).catch(error => 
            console.error(`Failed to delete document ${fileName} for ${employee.name}:`, error)
          )
        )
      }
    }

    // Execute all file deletions (don't block the response on these)
    if (fileDeletionPromises.length > 0) {
      console.log(`Initiating cleanup of ${fileDeletionPromises.length} files for ${result.deletedCount} employees`)
      Promise.all(fileDeletionPromises).then(() => {
        console.log(`Successfully cleaned up ${fileDeletionPromises.length} files for ${result.deletedCount} employees`)
      }).catch(error => {
        console.error(`Some files failed to delete during bulk deletion:`, error)
      })
    }

    console.log(`Bulk deleted ${result.deletedCount} employees:`, result.deletedEmployees.map(emp => emp.name))

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} employees`
    })

  } catch (error) {
    console.error('Bulk delete employees error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete employees'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export const POST = adminOnly(handleBulkDelete)
