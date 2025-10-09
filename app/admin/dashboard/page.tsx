'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AddEmployeeModal from '@/app/components/AddEmployeeModal'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import InvoiceModal from '@/app/components/InvoiceModal'
import AttendanceModal from '@/app/components/AttendanceModal'
import PaymentModal from '@/app/components/PaymentModal'
import { formatIndianDate } from '@/app/lib/indianLocalization'
import ButtonComponent from '@/app/components/ui/ButtonComponent'
import ThemeToggle from '@/app/components/ui/ThemeToggle'

interface User {
  id: string
  email: string
  role: string
}

interface Employee {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  dateOfJoining?: string
  uniqueSlug: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [stats, setStats] = useState<{
    totalEmployees: number;
    totalChallans: number;
    totalInvoices: number;
    totalPayments: number;
    totalDocuments: number;
  } | null>(null)

  const checkAuth = useCallback(async () => {
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
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

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

  // Check authentication on component mount
  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchStats()
  }, [checkAuth, fetchEmployees, fetchStats])

  const handleAddEmployeeSuccess = () => {
    fetchEmployees()
    fetchStats() // Refresh stats when employee is added
  }

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchEmployees() // Refresh the list
        fetchStats() // Refresh stats
        alert('Employee deleted successfully')
      } else {
        alert('Failed to delete employee')
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete employee')
    }
  }

  // Bulk selection functions
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map(emp => emp.id))
    }
  }

  const handleBulkDeleteEmployees = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select employees to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedEmployees.length} selected employees? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/employees/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeIds: selectedEmployees })
      })

      if (response.ok) {
        const result = await response.json()
        fetchEmployees() // Refresh the list
        fetchStats() // Refresh stats
        setSelectedEmployees([]) // Clear selection
        alert(`Successfully deleted ${result.deletedCount} employees`)
      } else {
        const error = await response.json()
        alert(`Failed to delete employees: ${error.error}`)
      }
    } catch (err) {
      console.error('Bulk delete failed:', err)
      alert('Failed to delete employees')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                ApexSolar Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ButtonComponent
                onClick={handleLogout}
                variant="danger"
                size="sm"
                className="w-full sm:w-auto"
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
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total Employees</dt>
                    <dd className="text-2xl font-bold text-foreground">{employees.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Documents</dt>
                    <dd className="text-2xl font-bold text-foreground">{stats?.totalDocuments || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Payments</dt>
                    <dd className="text-2xl font-bold text-foreground">{stats?.totalPayments || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Invoices</dt>
                    <dd className="text-2xl font-bold text-foreground">{stats?.totalInvoices || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="bg-card shadow-card rounded-xl border border-border transition-colors duration-300">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
              <div>
                <h3 className="text-lg leading-6 font-medium text-foreground">Employee Management</h3>
                {selectedEmployees.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedEmployees.length} employees selected</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedEmployees.length > 0 && (
                  <>
                    <ButtonComponent
                      onClick={handleBulkDeleteEmployees}
                      variant="danger"
                      size="sm"
                    >
                      🗑️ Delete Selected ({selectedEmployees.length})
                    </ButtonComponent>
                    <ButtonComponent
                      onClick={() => setSelectedEmployees([])}
                      variant="secondary"
                      size="sm"
                    >
                      Clear
                    </ButtonComponent>
                  </>
                )}
                <ButtonComponent
                  onClick={() => setShowAddEmployee(true)}
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Employee
                </ButtonComponent>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-lg">No employees found</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add your first employee to get started</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.length === employees.length && employees.length > 0}
                            onChange={handleSelectAllEmployees}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-slate-200 dark:divide-slate-700">
                    {employees.map((employee) => (
                      <tr key={employee.id} className={`transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedEmployees.includes(employee.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => handleSelectEmployee(employee.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {employee.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {employee.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {employee.dateOfJoining ? formatIndianDate(employee.dateOfJoining) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`/employee/${employee.uniqueSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs px-3 py-1 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                            >
                              View
                            </a>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowDocumentUpload(true)
                              }}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 text-xs px-3 py-1 border border-emerald-200 dark:border-emerald-600 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-200"
                            >
                              Docs
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowPaymentModal(true)
                              }}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 text-xs px-3 py-1 border border-yellow-200 dark:border-yellow-600 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors duration-200"
                            >
                              Payment
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowAttendanceModal(true)
                              }}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 text-xs px-3 py-1 border border-purple-200 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                            >
                              Attend
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs px-3 py-1 border border-red-200 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-foreground mb-1">{employee.name}</h4>
                        <p className="text-sm text-muted-foreground">{employee.email || 'No email'}</p>
                        <p className="text-sm text-muted-foreground">{employee.phone || 'No phone'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Joined: {employee.dateOfJoining ? formatIndianDate(employee.dateOfJoining) : 'N/A'}
                        </p>
                      </div>
                      <a
                        href={`/employee/${employee.uniqueSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs px-3 py-1 border border-blue-200 dark:border-blue-600 rounded-md bg-card hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                      >
                        View Profile
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <ButtonComponent
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowDocumentUpload(true)
                        }}
                        variant="success"
                        size="xs"
                        fullWidth
                        className="text-xs"
                      >
                        📄 Documents
                      </ButtonComponent>
                      <ButtonComponent
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowPaymentModal(true)
                        }}
                        variant="warning"
                        size="xs"
                        fullWidth
                        className="text-xs"
                      >
                        💰 Payment
                      </ButtonComponent>
                      <ButtonComponent
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowAttendanceModal(true)
                        }}
                        variant="info"
                        size="xs"
                        fullWidth
                        className="text-xs"
                      >
                        📊 Attendance
                      </ButtonComponent>
                      <ButtonComponent
                        onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                        variant="danger"
                        size="xs"
                        fullWidth
                        className="text-xs"
                      >
                        🗑️ Delete
                      </ButtonComponent>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Client Management</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Manage clients and track payments</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/clients')}
                variant="info"
                size="sm"
                fullWidth
              >
                Manage Clients →
              </ButtonComponent>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Attendance Tracking</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Manage employee attendance records</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/attendance')}
                variant="primary"
                size="sm"
                fullWidth
              >
                Manage Attendance →
              </ButtonComponent>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Payment Management</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Track dues and advances</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/payments')}
                variant="warning"
                size="sm"
                fullWidth
              >
                Manage Payments →
              </ButtonComponent>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Invoice Management</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Create, upload and manage invoices</p>
              <div className="flex flex-col gap-2">
                <ButtonComponent 
                  onClick={() => router.push('/admin/generate-invoice')}
                  variant="primary"
                  size="sm"
                  fullWidth
                >
                  Generate Invoice
                </ButtonComponent>
                <ButtonComponent 
                  onClick={() => setShowInvoiceModal(true)}
                  variant="success"
                  size="sm"
                  fullWidth
                >
                  Upload Invoice
                </ButtonComponent>
                <ButtonComponent 
                  onClick={() => router.push('/admin/invoices')}
                  variant="secondary"
                  size="sm"
                  fullWidth
                >
                  View All Invoices
                </ButtonComponent>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">PF/ESI Challans</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">View challans uploaded by accountant</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/challans')}
                variant="warning"
                size="sm"
                fullWidth
              >
                View PF/ESI Challans →
              </ButtonComponent>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Document Management</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Upload and manage all documents</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/documents')}
                variant="info"
                size="sm"
                fullWidth
              >
                Manage Documents →
              </ButtonComponent>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow-card rounded-xl border border-border transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Company Settings</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Manage bank details and company information</p>
              <ButtonComponent 
                onClick={() => router.push('/admin/company-settings')}
                variant="info"
                size="sm"
                fullWidth
              >
                Company Settings →
              </ButtonComponent>
            </div>
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={handleAddEmployeeSuccess}
      />

      {/* Document Upload Modal */}
      {selectedEmployee && (
        <DocumentUploadModal
          isOpen={showDocumentUpload}
          onClose={() => {
            setShowDocumentUpload(false)
            setSelectedEmployee(null)
          }}
          onDocumentUploaded={() => {
            setShowDocumentUpload(false)
            setSelectedEmployee(null)
            fetchStats() // Refresh stats after document upload
          }}
        />
      )}

      {/* Payment Modal */}
      {selectedEmployee && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedEmployee(null)
          }}
          onSuccess={() => {
            setShowPaymentModal(false)
            setSelectedEmployee(null)
            fetchStats() // Refresh stats after payment
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}

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
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={() => {
          setShowInvoiceModal(false)
          fetchStats() // Refresh stats after invoice upload
        }}
      />
    </div>
  )
}
