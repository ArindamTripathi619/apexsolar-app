import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const env = process.env.NODE_ENV
    const cwd = process.cwd()
    
    // Test file system access
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const uploadsDir = path.join(cwd, 'uploads', 'invoices')
    
    let directoryExists = false
    let directoryWritable = false
    let filesInDirectory: string[] = []
    
    try {
      await fs.access(uploadsDir)
      directoryExists = true
      
      try {
        await fs.access(uploadsDir, (await import('fs')).constants.W_OK)
        directoryWritable = true
      } catch (e) {
        // Directory not writable
      }
      
      try {
        const files = await fs.readdir(uploadsDir)
        filesInDirectory = files.slice(0, 5) // Show first 5 files
      } catch (e) {
        // Can't read directory
      }
    } catch (e) {
      // Directory doesn't exist
    }
    
    return NextResponse.json({
      environment: env,
      workingDirectory: cwd,
      uploadsDirectory: uploadsDir,
      directoryExists,
      directoryWritable,
      filesInDirectory,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
