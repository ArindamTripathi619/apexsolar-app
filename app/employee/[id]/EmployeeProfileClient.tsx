'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatIndianDate, formatIndianCurrency } from '@/app/lib/indianLocalization'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  FileText, 
  CreditCard, 
  Clock,
  Eye,
  EyeOff,
  Download
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  department: string
  hireDate: Date
  status: string
  salary?: number
  address?: string
  profileImage?: string
  documents: Array<{
    id: string
    name: string
    type: string
    uploadDate: Date
    fileUrl: string
  }>
  payments: Array<{
    id: string
    amount: number
    date: Date
    type: string
    status: string
    description?: string
  }>
  attendanceRecords: Array<{
    id: string
    date: Date
    checkIn?: Date
    checkOut?: Date
    status: string
    hoursWorked?: number
  }>
}

interface EmployeeProfileClientProps {
  employee: Employee
}

export default function EmployeeProfileClient({ employee }: EmployeeProfileClientProps) {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)

  const maskEmail = (email: string) => {
    if (showSensitiveInfo) return email
    const [username, domain] = email.split('@')
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    return `${maskedUsername}@${domain}`
  }

  const maskPhone = (phone: string) => {
    if (showSensitiveInfo) return phone
    return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2')
  }

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(amount)
  }

  const formatDate = (date: Date) => {
    return formatIndianDate(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={employee.profileImage} alt={employee.name} />
                <AvatarFallback className="text-lg">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
                    <p className="text-lg text-gray-700 mt-1">{employee.position}</p>
                    <p className="text-md text-gray-700">{employee.department}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Badge 
                      variant={employee.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize text-gray-800 bg-gray-100 border-gray-300"
                    >
                      {employee.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                    >
                      {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showSensitiveInfo ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 text-gray-700 data-[state=active]:text-white data-[state=active]:bg-gray-900">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Overview</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 text-gray-700 data-[state=active]:text-white data-[state=active]:bg-gray-900">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Documents</span>
              <span className="xs:hidden">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 text-gray-700 data-[state=active]:text-white data-[state=active]:bg-gray-900">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Payments</span>
              <span className="xs:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 text-gray-700 data-[state=active]:text-white data-[state=active]:bg-gray-900">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Attendance</span>
              <span className="xs:hidden">Att</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-800">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-800">{maskEmail(employee.email)}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-800">{maskPhone(employee.phone)}</span>
                    </div>
                  )}
                  {employee.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-800">{showSensitiveInfo ? employee.address : '***'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-800">Hired {formatDate(employee.hireDate)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-800">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="text-lg text-gray-800">{employee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <p className="text-lg text-gray-800">{employee.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="text-lg text-gray-800 capitalize">{employee.status}</p>
                  </div>
                  {employee.salary && showSensitiveInfo && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Salary</label>
                      <p className="text-lg text-gray-800">{formatCurrency(employee.salary)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-800">Employee Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.documents.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No documents available</p>
                ) : (
                  <div className="space-y-4">
                    {employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">{doc.name}</p>
                            <p className="text-sm text-gray-600">
                              {doc.type} • Uploaded {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-800">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.payments.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No payment records available</p>
                ) : (
                  <div className="space-y-4">
                    {employee.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-600">
                              {payment.type} • {formatDate(payment.date)}
                              {payment.description && ` • ${payment.description}`}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-800">Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.attendanceRecords.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No attendance records available</p>
                ) : (
                  <div className="space-y-4">
                    {employee.attendanceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">{formatDate(record.date)}</p>
                            <p className="text-sm text-gray-600">
                              {record.checkIn && `In: ${formatTime(record.checkIn)}`}
                              {record.checkOut && ` • Out: ${formatTime(record.checkOut)}`}
                              {record.hoursWorked && ` • ${record.hoursWorked}h worked`}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={record.status === 'present' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
