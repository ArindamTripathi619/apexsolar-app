'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceModal from '@/app/components/AttendanceModal'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

interface User {
  id: string
  email: string
  role: string
}

interface Employee {
  id: string
  name: string
  attendance?: Attendance[]
}

interface Attendance {
  id: string
  month: number
  year: number
  daysWorked: number
  employee: {
    name: string
  }
}

export default function AttendanceManagement() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchAttendance()
  }, [selectedMonth, selectedYear])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success && data.data.role === 'ADMIN') {
        setUser(data.data)
      } else {
        router.push('/admin/login')
      }
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmployees(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
  }

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAttendance(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/admin/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const getAttendanceForEmployee = (employeeId: string) => {
    return attendance.find(a => a.id === employeeId)?.daysWorked || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Attendance Management
              </h1>
              <p className="text-foreground/60 mt-1">Manage employee attendance records</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="outline" 
              size="md"
              onClick={() => router.push('/admin/dashboard')}
            >
              Back to Dashboard
            </ButtonComponent>
            <ButtonComponent 
              variant="danger" 
              size="md"
              onClick={handleLogout}
            >
              Logout
            </ButtonComponent>
          </div>
        </div>
        {/* Month/Year Filter */}
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground">Filter Records</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-foreground mb-2">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-foreground mb-2">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Management */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground">
              Attendance Records - {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
            </h3>
          </div>

          {employees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No employees found</h3>
              <p className="text-foreground/60">Add employees to start managing attendance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Days Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {employees.map((employee) => {
                    const daysWorked = employee.attendance?.find(a => a.month === selectedMonth && a.year === selectedYear)?.daysWorked || 0
                    return (
                      <tr key={employee.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                          {daysWorked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            daysWorked >= 20 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : daysWorked >= 15 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {daysWorked >= 20 ? 'Full Attendance' : daysWorked >= 15 ? 'Partial' : 'Low Attendance'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <ButtonComponent
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee)
                              setShowAttendanceModal(true)
                            }}
                          >
                            {daysWorked > 0 ? 'Edit' : 'Add'} Attendance
                          </ButtonComponent>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {selectedEmployee && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false)
            setSelectedEmployee(null)
          }}
          onSuccess={() => {
            setShowAttendanceModal(false)
            setSelectedEmployee(null)
            fetchEmployees()
            fetchAttendance()
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}
    </div>
  )
}
