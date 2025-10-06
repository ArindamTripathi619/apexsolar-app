import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'

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

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    
    const document = await prisma.document.findUnique({
      where: { id },
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

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const canAccess = 
      user.role === 'ADMIN' ||
      document.isPublic ||
      document.uploadedBy === user.id ||
      document.uploadedFor === user.id

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: document
    })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const document = await prisma.document.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const canDelete = 
      user.role === 'ADMIN' ||
      document.uploadedBy === user.id

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
