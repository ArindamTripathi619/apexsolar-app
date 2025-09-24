import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathParams } = await params
  
  try {
    const filePath = path.join(process.cwd(), 'uploads', ...pathParams)
    
    // Security check: ensure file is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const resolvedPath = path.resolve(filePath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)
    const fileExtension = path.extname(filePath).toLowerCase()
    
    // Set appropriate content type
    let contentType = 'application/octet-stream'
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600'
      }
    })
  } catch (error) {
    console.error('File serving error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
