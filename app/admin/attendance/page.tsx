'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceModal from '@/app/components/AttendanceModal'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600">Manage employee attendance records</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Month/Year Filter */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Attendance Records - {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h3>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees found.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Worked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => {
                      const daysWorked = employee.attendance?.find(a => a.month === selectedMonth && a.year === selectedYear)?.daysWorked || 0
                      return (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {daysWorked}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              daysWorked >= 20 
                                ? 'bg-green-100 text-green-800' 
                                : daysWorked >= 15 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {daysWorked >= 20 ? 'Full Attendance' : daysWorked >= 15 ? 'Partial' : 'Low Attendance'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowAttendanceModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm px-3 py-1 border border-blue-200 rounded"
                            >
                              {daysWorked > 0 ? 'Edit' : 'Add'} Attendance
                            </button>
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
      </main>

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
