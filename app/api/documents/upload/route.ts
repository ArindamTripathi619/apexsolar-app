import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { adminOnly, AuthenticatedRequest } from '@/app/lib/middleware'
import { uploadFile, ALLOWED_FILE_TYPES } from '@/app/lib/upload'
import { DocumentType } from '@prisma/client'

async function uploadDocument(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const employeeId = formData.get('employeeId') as string
    const documentType = formData.get('documentType') as DocumentType

    if (!file || !employeeId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if document of this type already exists
    const existingDocument = await prisma.employeeDocument.findFirst({
      where: {
        employeeId,
        type: documentType
      }
    })

    // Upload file
    const uploadResult = await uploadFile(
      file,
      `employees/${employeeId}`,
      ALLOWED_FILE_TYPES.document
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      )
    }

    // If document exists, update it; otherwise create new
    let document
    if (existingDocument) {
      document = await prisma.employeeDocument.update({
        where: { id: existingDocument.id },
        data: {
          fileName: uploadResult.fileName!,
          fileUrl: uploadResult.fileUrl!,
          uploadedAt: new Date()
        }
      })
    } else {
      document = await prisma.employeeDocument.create({
        data: {
          employeeId,
          type: documentType,
          fileName: uploadResult.fileName!,
          fileUrl: uploadResult.fileUrl!
        }
      })
    }

    // Update profile photo URL if it's a profile photo
    if (documentType === 'PROFILE_PHOTO') {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { profilePhotoUrl: uploadResult.fileUrl }
      })
    }

    return NextResponse.json({
      success: true,
      data: document
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

export const POST = adminOnly(uploadDocument)
