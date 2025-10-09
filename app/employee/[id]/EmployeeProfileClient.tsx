'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatIndianDate } from '@/app/lib/indianLocalization'
import ButtonComponent from '@/app/components/ui/ButtonComponent'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  FileText,
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

  const formatDate = (date: Date) => {
    return formatIndianDate(date)
  }

  return (
    <div className="min-h-screen bg-background py-8">
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
                    <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
                    <p className="text-lg text-muted-foreground mt-1">{employee.position}</p>
                    <p className="text-md text-muted-foreground">{employee.department}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Badge 
                      variant={employee.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
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
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-0">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Overview</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Documents</span>
              <span className="xs:hidden">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{maskEmail(employee.email)}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{maskPhone(employee.phone)}</span>
                    </div>
                  )}
                  {employee.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{showSensitiveInfo ? employee.address : '***'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Hired {formatDate(employee.hireDate)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-lg text-foreground">{employee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="text-lg text-foreground">{employee.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-lg text-foreground capitalize">{employee.status}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Employee Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents available</p>
                ) : (
                  <div className="space-y-4">
                    {employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type} • Uploaded {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ButtonComponent
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                            icon={<Eye className="h-4 w-4" />}
                          >
                            View
                          </ButtonComponent>
                          <ButtonComponent
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.fileUrl;
                              link.download = doc.name;
                              link.click();
                            }}
                            icon={<Download className="h-4 w-4" />}
                          >
                            Download
                          </ButtonComponent>
                        </div>
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
