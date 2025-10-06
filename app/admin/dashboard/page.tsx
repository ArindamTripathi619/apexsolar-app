'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AddEmployeeModal from '@/app/components/AddEmployeeModal'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import PaymentModal from '@/app/components/PaymentModal'
import AttendanceModal from '@/app/components/AttendanceModal'
import InvoiceModal from '@/app/components/InvoiceModal'

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">ApexSolar Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back, {user?.email}</p>
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
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                    <dd className="text-lg font-medium text-gray-900">{employees.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">📄</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalDocuments || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Payments</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalPayments || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalInvoices || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Employee Management</h3>
                {selectedEmployees.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{selectedEmployees.length} employees selected</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedEmployees.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkDeleteEmployees}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      🗑️ Delete Selected ({selectedEmployees.length})
                    </button>
                    <button
                      onClick={() => setSelectedEmployees([])}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Clear
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
                >
                  Add Employee
                </button>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No employees found. Add your first employee to get started.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.length === employees.length && employees.length > 0}
                            onChange={handleSelectAllEmployees}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className={selectedEmployees.includes(employee.id) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => handleSelectEmployee(employee.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`/employee/${employee.uniqueSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded"
                            >
                              View
                            </a>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowDocumentUpload(true)
                              }}
                              className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-200 rounded"
                            >
                              Docs
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowPaymentModal(true)
                              }}
                              className="text-yellow-600 hover:text-yellow-900 text-xs px-2 py-1 border border-yellow-200 rounded"
                            >
                              Payment
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowAttendanceModal(true)
                              }}
                              className="text-purple-600 hover:text-purple-900 text-xs px-2 py-1 border border-purple-200 rounded"
                            >
                              Attend
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-200 rounded"
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
                  <div key={employee.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.email || 'No email'}</p>
                        <p className="text-sm text-gray-600">{employee.phone || 'No phone'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <a
                        href={`/employee/${employee.uniqueSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded bg-white"
                      >
                        View Profile
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowDocumentUpload(true)
                        }}
                        className="w-full text-center bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded font-medium"
                      >
                        📄 Documents
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowPaymentModal(true)
                        }}
                        className="w-full text-center bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-2 rounded font-medium"
                      >
                        💰 Payment
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowAttendanceModal(true)
                        }}
                        className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded font-medium"
                      >
                        📊 Attendance
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                        className="w-full text-center bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded font-medium"
                      >
                        🗑️ Delete
                      </button>
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
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Management</h3>
              <p className="text-sm text-gray-500 mb-4">Manage clients and track payments</p>
              <button 
                onClick={() => router.push('/admin/clients')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Manage Clients →
              </button>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Tracking</h3>
              <p className="text-sm text-gray-500 mb-4">Manage employee attendance records</p>
              <button 
                onClick={() => router.push('/admin/attendance')}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Manage Attendance →
              </button>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Management</h3>
              <p className="text-sm text-gray-500 mb-4">Track dues and advances</p>
              <button 
                onClick={() => router.push('/admin/payments')}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Manage Payments →
              </button>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Management</h3>
              <p className="text-sm text-gray-500 mb-4">Upload and manage invoices</p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Upload Invoice
                </button>
                <button 
                  onClick={() => router.push('/admin/invoices')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  View All Invoices
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">PF/ESI Challans</h3>
              <p className="text-sm text-gray-500 mb-4">View challans uploaded by accountant</p>
              <button 
                onClick={() => router.push('/admin/challans')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                View PF/ESI Challans →
              </button>
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
          onSuccess={() => {
            setShowDocumentUpload(false)
            setSelectedEmployee(null)
            fetchStats() // Refresh stats after document upload
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
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
