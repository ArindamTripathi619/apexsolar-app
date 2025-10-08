'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ChallanModal from '@/app/components/ChallanModal'
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
}

export default function AccountantDashboard() {
  const router = useRouter()
  const [_user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showPfModal, setShowPfModal] = useState(false)
  const [showEsiModal, setShowEsiModal] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (!response.ok) {
        router.push('/accountant/login')
        return
      }

      const data = await response.json()
      if (data.success && data.data.role === 'ACCOUNTANT') {
        setUser(data.data)
      } else {
        router.push('/accountant/login')
      }
    } catch (_err) {
      router.push('/accountant/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchEmployees = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [checkAuth, fetchEmployees])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/accountant/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const getAttendanceForMonth = (employee: Employee, month: number, year: number) => {
    return employee.attendance?.find(a => a.month === month && a.year === year)?.daysWorked || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700/30 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Accountant Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-300">Welcome, {_user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ButtonComponent
                onClick={handleLogout}
                variant="danger"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </ButtonComponent>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Month/Year Filter */}
        <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700/30 rounded-xl mb-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Filter Attendance</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <label htmlFor="month" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-3 px-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-3 px-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
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
        <div className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
                Attendance Report - {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h3>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-lg">No employees found</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Employee data will appear here when available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Employee Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Days Worked
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {employees.map((employee) => {
                      const daysWorked = getAttendanceForMonth(employee, selectedMonth, selectedYear)
                      return (
                        <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center">
                              <span className="font-semibold">{daysWorked}</span>
                              <span className="ml-1 text-xs">days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              daysWorked >= 20 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
                                : daysWorked >= 15 
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
            )}
          </div>
        </div>

        {/* PF/ESI Upload Section */}
        <div className="mt-8 bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
                PF/ESI Challan Upload
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-2">Upload PF Challan</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Upload monthly PF challan document for employee benefits</p>
                <ButtonComponent
                  onClick={() => setShowPfModal(true)}
                  variant="primary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </ButtonComponent>
              </div>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-2">Upload ESI Challan</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Upload monthly ESI challan document for medical benefits</p>
                <ButtonComponent
                  onClick={() => setShowEsiModal(true)}
                  variant="success"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </ButtonComponent>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="group p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200 cursor-pointer border border-indigo-200 dark:border-indigo-700"
                   onClick={() => router.push('/accountant/documents')}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Document Management</div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">View and manage all company documents and employee files</div>
                <div className="mt-3 flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  <span>Manage Documents</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-200 cursor-pointer border border-orange-200 dark:border-orange-700"
                   onClick={() => router.push('/accountant/challans')}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-medium group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">View Challans</div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">View uploaded PF/ESI challans and compliance documents</div>
                <div className="mt-3 flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium group-hover:text-orange-700 dark:group-hover:text-orange-300">
                  <span>View Challans</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PF Challan Modal */}
      <ChallanModal
        isOpen={showPfModal}
        onClose={() => setShowPfModal(false)}
        onSuccess={() => setShowPfModal(false)}
        challanType="PF"
      />

      {/* ESI Challan Modal */}
      <ChallanModal
        isOpen={showEsiModal}
        onClose={() => setShowEsiModal(false)}
        onSuccess={() => setShowEsiModal(false)}
        challanType="ESI"
      />
    </div>
  )
}

