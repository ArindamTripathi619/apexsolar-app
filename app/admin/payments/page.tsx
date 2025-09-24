'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PaymentModal from '@/app/components/PaymentModal'

interface User {
  id: string
  email: string
  role: string
}

interface Employee {
  id: string
  name: string
  payments?: Payment[]
}

interface Payment {
  id: string
  type: 'DUE' | 'ADVANCE' | 'DUE_CLEARED' | 'ADVANCE_REPAID'
  amount: number
  description?: string
  date: string
  clearedPaymentId?: string
  isCleared?: boolean
  employee: {
    name: string
  }
}

export default function PaymentManagement() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'DUE' | 'ADVANCE' | 'CLEARED'>('ALL')

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchPayments()
  }, [])

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

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPayments(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
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

  const handleDeletePayment = async (paymentId: string, employeeName: string, amount: number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.toLowerCase()} payment of ₹${amount.toFixed(2)} for ${employeeName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchPayments() // Refresh the list
        alert('Payment deleted successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete payment')
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete payment')
    }
  }

  const handleClearPayment = async (paymentId: string, employeeName: string, amount: number, type: string) => {
    if (!confirm(`Are you sure you want to clear this ${type.toLowerCase()} payment of ₹${amount.toFixed(2)} for ${employeeName}?`)) {
      return
    }

    try {
      const response = await fetch('/api/payments/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        fetchPayments() // Refresh the list
        alert(data.message || 'Payment cleared successfully')
      } else {
        alert(data.error || 'Failed to clear payment')
      }
    } catch (err) {
      console.error('Clear failed:', err)
      alert('Failed to clear payment')
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (filter === 'ALL') return true
    if (filter === 'CLEARED') return payment.type === 'DUE_CLEARED' || payment.type === 'ADVANCE_REPAID'
    return payment.type === filter
  })

  const totalDues = payments.filter(p => p.type === 'DUE').reduce((sum, p) => sum + p.amount, 0)
  const totalAdvances = payments.filter(p => p.type === 'ADVANCE').reduce((sum, p) => sum + p.amount, 0)
  const totalDuesCleared = payments.filter(p => p.type === 'DUE_CLEARED').reduce((sum, p) => sum + p.amount, 0)
  const totalAdvancesRepaid = payments.filter(p => p.type === 'ADVANCE_REPAID').reduce((sum, p) => sum + p.amount, 0)
  
  // Calculate net balances after accounting for cleared payments
  const netDues = totalDues - totalDuesCleared
  const netAdvances = totalAdvances - totalAdvancesRepaid
  
  // Balance calculation: Net Advances are positive, Net Dues are negative
  const netBalance = netAdvances - netDues

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage employee payments, dues, and advances</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Dues</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{netDues.toFixed(2)}</dd>
                    <dd className="text-xs text-gray-500 mt-1">₹{totalDuesCleared.toFixed(2)} cleared</dd>
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
                    <span className="text-white font-bold">💵</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Advances</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{netAdvances.toFixed(2)}</dd>
                    <dd className="text-xs text-gray-500 mt-1">₹{totalAdvancesRepaid.toFixed(2)} repaid</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Balance</dt>
                    <dd className={`text-lg font-medium ${
                      netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>₹{Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? '(Credit)' : '(Debit)'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Payment by Employee */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Payment</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h4 className="font-medium text-gray-900">{employee.name}</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {employee.payments?.length || 0} payment(s)
                  </p>
                  <button
                    onClick={() => {
                      setSelectedEmployee(employee)
                      setShowPaymentModal(true)
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Add Payment
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment History</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'ALL' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('DUE')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'DUE' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Dues
                </button>
                <button
                  onClick={() => setFilter('ADVANCE')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'ADVANCE' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Advances
                </button>
                <button
                  onClick={() => setFilter('CLEARED')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'CLEARED' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cleared
                </button>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payments found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.type === 'DUE' 
                                ? 'bg-red-100 text-red-800' 
                                : payment.type === 'ADVANCE'
                                ? 'bg-green-100 text-green-800'
                                : payment.type === 'DUE_CLEARED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payment.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {payment.description || 'No description'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {(!payment.isCleared && (payment.type === 'DUE' || payment.type === 'ADVANCE')) && (
                                <button
                                  onClick={() => handleClearPayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
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
                <div className="sm:hidden space-y-3">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">{payment.employee.name}</h4>
                          <p className="text-sm text-gray-600">{payment.description || 'No description'}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.type === 'DUE' 
                            ? 'bg-red-100 text-red-800' 
                            : payment.type === 'ADVANCE'
                            ? 'bg-green-100 text-green-800'
                            : payment.type === 'DUE_CLEARED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">₹{payment.amount.toFixed(2)}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</span>
                          {(!payment.isCleared && (payment.type === 'DUE' || payment.type === 'ADVANCE')) && (
                            <button
                              onClick={() => handleClearPayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

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
            fetchPayments()
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}
    </div>
  )
}
