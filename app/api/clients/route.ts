import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '../../lib/auth'

async function authenticateRequest(request: NextRequest) {
  // Try to get token from cookies first
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyToken(token)
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    // Debug authentication
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    console.log('Auth debug:', {
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString()
    })
    const user = await authenticateRequest(request)

    // Test database connection
    try {
      await (prisma as any).$queryRaw`SELECT 1`
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : "Unknown database error" }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch clients with invoices and payments to calculate due amounts
    const clients = await prisma.client.findMany({
      include: {
        invoices: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate due amounts for each client
    const clientsWithDue = clients.map((client: any) => {
      const totalInvoiceAmount = client.invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0)
      const totalPayments = client.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
      const dueAmount = totalInvoiceAmount - totalPayments

      return {
        ...client,
        totalInvoiceAmount,
        totalPayments,
        dueAmount
      }
    })

    // Calculate total due amount across all clients
    const totalDue = clientsWithDue.reduce((sum: number, client: any) => sum + client.dueAmount, 0)

    return NextResponse.json({
      success: true,
      clients: clientsWithDue,
      totalDue
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log environment info for debugging
    console.log('POST /api/clients - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Connected' : 'Not set',
      timestamp: new Date().toISOString()
    })
    // Debug authentication
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    console.log('Auth debug:', {
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString()
    })
    const user = await authenticateRequest(request)

    // Test database connection
    try {
      await (prisma as any).$queryRaw`SELECT 1`
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : "Unknown database error" }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      companyName, 
      addressLine1,
      addressLine2, 
      city, 
      state, 
      pinCode, 
      gstNumber, 
      panNumber,
      contactPerson, 
      email, 
      phone 
    } = body

    // Validate required fields (only companyName and addressLine1 are required)
    if (!companyName || !addressLine1) {
      return NextResponse.json({ 
        error: 'Missing required fields: companyName and addressLine1 are required' 
      }, { status: 400 })
    }

    // Create client in database
    const client = await prisma.client.create({
      data: {
        companyName,
        addressLine1,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null
      }
    })

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully'
    })
  } catch (error) {
    console.error('Error creating client:', {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Debug authentication
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    console.log('Auth debug:', {
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString()
    })
    const user = await authenticateRequest(request)

    // Test database connection
    try {
      await (prisma as any).$queryRaw`SELECT 1`
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : "Unknown database error" }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      companyName, 
      addressLine1,
      addressLine2, 
      city, 
      state, 
      pinCode, 
      gstNumber, 
      panNumber,
      contactPerson, 
      email, 
      phone 
    } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json({ 
        error: 'Client ID is required for update' 
      }, { status: 400 })
    }

    if (!companyName || !addressLine1) {
      return NextResponse.json({ 
        error: 'Missing required fields: companyName and addressLine1 are required' 
      }, { status: 400 })
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: id }
    })

    if (!existingClient) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 })
    }

    // Update client in database
    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: {
        companyName,
        addressLine1,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Debug authentication
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    console.log('Auth debug:', {
      hasCookieToken: !!cookieToken,
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString()
    })
    const user = await authenticateRequest(request)

    // Test database connection
    try {
      await (prisma as any).$queryRaw`SELECT 1`
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : "Unknown database error" }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Client ID is required for deletion' 
      }, { status: 400 })
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: id },
      include: {
        invoices: true,
        payments: true
      }
    })

    if (!existingClient) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 })
    }

    // Check if client has associated invoices or payments
    if (existingClient.invoices.length > 0 || existingClient.payments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with existing invoices or payments. Please remove all associated records first.' 
      }, { status: 400 })
    }

    // Delete client
    await prisma.client.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
