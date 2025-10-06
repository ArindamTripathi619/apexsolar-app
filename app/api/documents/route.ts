import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { uploadFile } from '@/app/lib/upload'
import { DocumentCategory } from '@prisma/client'

async function authenticateRequest(request: NextRequest) {
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyToken(token)
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can access documents
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Documents are only accessible to Admin and Accountant roles.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const uploadedBy = searchParams.get('uploadedBy')
    const tags = searchParams.get('tags')
    const isPublic = searchParams.get('isPublic')

    const whereClause: any = {}
    
    if (user.role === 'ADMIN') {
      // Admin can see all documents
    } else if (user.role === 'ACCOUNTANT') {
      whereClause.OR = [
        { isPublic: true },
        { uploadedBy: user.id }
      ]
    }
    
    if (category && Object.values(DocumentCategory).includes(category as DocumentCategory)) {
      whereClause.category = category as DocumentCategory
    }
    
    if (uploadedBy) {
      whereClause.uploadedBy = uploadedBy
    }
    
    if (tags) {
      whereClause.tags = {
        hasSome: tags.split(',').map(tag => tag.trim())
      }
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      whereClause.isPublic = isPublic === 'true'
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: documents
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can upload documents
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only Admin and Accountant can upload documents.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as DocumentCategory
    const uploadedFor = formData.get('uploadedFor') as string
    const tags = formData.get('tags') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!file || !title) {
      return NextResponse.json(
        { success: false, error: 'File and title are required' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, Word, Excel, text files and images are allowed' },
        { status: 400 }
      )
    }

    const uploadResult = await uploadFile(file, 'documents', allowedTypes)
    
    if (!uploadResult.success || !uploadResult.fileName || !uploadResult.fileUrl) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "Upload failed" },
        { status: 500 }
      )
    }

    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        category: (category?.toUpperCase() as DocumentCategory) || DocumentCategory.GENERAL,
        uploadedBy: user.id,
        uploadedFor,
        tags: tagArray,
        isPublic
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: document
    })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
