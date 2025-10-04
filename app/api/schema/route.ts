import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check if this is authorized (basic security)
    const { password } = await request.json()
    if (password !== 'InitializeApexSolar2024!') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Running Prisma migrations...')
    
    // Run prisma db push to create tables
    const { stdout, stderr } = await execAsync('npx prisma db push --force-reset')
    
    console.log('Prisma output:', stdout)
    if (stderr) {
      console.error('Prisma stderr:', stderr)
    }

    return NextResponse.json({ 
      message: 'Database schema created successfully',
      output: stdout,
      errors: stderr
    })

  } catch (error) {
    console.error('Schema creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}