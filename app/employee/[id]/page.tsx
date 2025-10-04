import { prisma } from '@/app/lib/prisma'
import { notFound } from 'next/navigation'
import EmployeeProfileClient from './EmployeeProfileClient'

export default async function EmployeeProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const employee = await prisma.employee.findUnique({
      where: { uniqueSlug: id },
      include: {
        documents: true,
        payments: {
          orderBy: { date: 'desc' },
          take: 10
        },
        attendance: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12
        }
      }
    })

    if (!employee) {
      notFound()
    }

    // Transform and prepare employee data for the client component
    const employeeData = {
      id: employee.id,
      name: employee.name,
      email: employee.email || 'Not provided',
      phone: employee.phone || undefined,
      position: 'Employee', // Default position
      department: 'General', // Default department
      hireDate: employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date(),
      status: 'active', // Default status
      salary: undefined,
      address: employee.address || undefined,
      profileImage: employee.profilePhotoUrl || undefined,
      documents: employee.documents.map(doc => ({
        id: doc.id,
        name: doc.fileName,
        type: doc.type,
        uploadDate: doc.uploadedAt,
        fileUrl: doc.fileUrl
      })),
      payments: employee.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.date,
        type: payment.type.toString(),
        status: 'completed', // Default status
        description: payment.description || undefined
      })),
      attendanceRecords: employee.attendance.map(record => ({
        id: record.id,
        date: new Date(record.year, record.month - 1, 1), // Create a date from year/month
        checkIn: undefined,
        checkOut: undefined,
        status: 'present', // Default status
        hoursWorked: record.daysWorked * 8 // Approximate hours based on days
      })),
    }

    // Use the EmployeeProfileClient component to render the UI
    return <EmployeeProfileClient employee={employeeData} />
  } catch (error) {
    console.error('Error fetching employee:', error)
    notFound()
  }
}
