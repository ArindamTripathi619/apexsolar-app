'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChallanModal from '@/app/components/ChallanModal'
import UploadedChallansView from '@/app/components/UploadedChallansView'

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
}

export default function AttendanceDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showPfModal, setShowPfModal] = useState(false)
  const [showEsiModal, setShowEsiModal] = useState(false)
  const [refreshChallans, setRefreshChallans] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        router.push('/attendance/login')
        return
      }

      const data = await response.json()
      if (data.success && (data.data.role === 'ADMIN' || data.data.role === 'ACCOUNTANT')) {
        setUser(data.data)
      } else {
        router.push('/attendance/login')
      }
    } catch (err) {
      router.push('/attendance/login')
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/attendance/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const getAttendanceForMonth = (employee: Employee, month: number, year: number) => {
    return employee.attendance?.find(a => a.month === month && a.year === year)?.daysWorked || 0
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Attendance Portal</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome, {user?.email} ({user?.role})</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            >
              Logout
            </button>
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

        {/* Attendance Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Attendance Report - {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h3>
              {user?.role === 'ACCOUNTANT' && (
                <div className="text-sm text-gray-500">
                  (Read-only view)
                </div>
              )}
            </div>
            
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => {
                        const daysWorked = getAttendanceForMonth(employee, selectedMonth, selectedYear)
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
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {employees.map((employee) => {
                    const daysWorked = getAttendanceForMonth(employee, selectedMonth, selectedYear)
                    return (
                      <div key={employee.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-base font-medium text-gray-900">{employee.name}</h4>
                          <span className="text-lg font-bold text-gray-700">{daysWorked} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Attendance Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            daysWorked >= 20 
                              ? 'bg-green-100 text-green-800' 
                              : daysWorked >= 15 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {daysWorked >= 20 ? 'Full' : daysWorked >= 15 ? 'Partial' : 'Low'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* PF/ESI Upload Section */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              PF/ESI Challan Upload
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <h4 className="text-md font-medium text-gray-900 mb-2">Upload PF Challan</h4>
                <p className="text-sm text-gray-500 mb-4">Upload monthly PF challan document</p>
                <button 
                  onClick={() => setShowPfModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Choose File
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <h4 className="text-md font-medium text-gray-900 mb-2">Upload ESI Challan</h4>
                <p className="text-sm text-gray-500 mb-4">Upload monthly ESI challan document</p>
                <button 
                  onClick={() => setShowEsiModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Previously Uploaded Challans */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Previously Uploaded Challans
            </h3>
            <UploadedChallansView key={refreshChallans} />
          </div>
        </div>
      </main>

      {/* PF Challan Modal */}
      <ChallanModal
        isOpen={showPfModal}
        onClose={() => setShowPfModal(false)}
        onSuccess={() => {
          setShowPfModal(false)
          setRefreshChallans(prev => prev + 1)
        }}
        challanType="PF"
      />

      {/* ESI Challan Modal */}
      <ChallanModal
        isOpen={showEsiModal}
        onClose={() => setShowEsiModal(false)}
        onSuccess={() => {
          setShowEsiModal(false)
          setRefreshChallans(prev => prev + 1)
        }}
        challanType="ESI"
      />
    </div>
  )
}
