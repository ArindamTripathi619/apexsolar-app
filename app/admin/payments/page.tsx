'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PaymentModal from '@/app/components/PaymentModal'
import { formatIndianDate, formatIndianCurrency } from '@/app/lib/indianLocalization'
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
    if (!confirm(`Are you sure you want to delete this ${type.toLowerCase()} payment of ${formatIndianCurrency(amount)} for ${employeeName}?`)) {
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
    if (!confirm(`Are you sure you want to clear this ${type.toLowerCase()} payment of ${formatIndianCurrency(amount)} for ${employeeName}?`)) {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading payment data...</p>
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
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Payment Management
              </h1>
              <p className="text-foreground/60 mt-1">Manage employee payments, dues, and advances</p>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Net Dues</p>
                <p className="text-3xl font-bold text-red-600">{formatIndianCurrency(netDues)}</p>
                <p className="text-xs text-foreground/50 mt-1">{formatIndianCurrency(totalDuesCleared)} cleared</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">�</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Net Advances</p>
                <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(netAdvances)}</p>
                <p className="text-xs text-foreground/50 mt-1">{formatIndianCurrency(totalAdvancesRepaid)} repaid</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">�</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Net Balance</p>
                <p className={`text-3xl font-bold ${
                  netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>{formatIndianCurrency(Math.abs(netBalance))}</p>
                <p className="text-xs text-foreground/50 mt-1">{netBalance >= 0 ? 'Credit' : 'Debit'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Payment by Employee */}
        <div className="bg-card border border-border rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              👥 Add Payment by Employee
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-muted/30 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <h4 className="font-medium text-foreground">{employee.name}</h4>
                  <p className="text-sm text-foreground/60 mb-3">
                    {employee.payments?.length || 0} payment(s)
                  </p>
                  <ButtonComponent
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee)
                      setShowPaymentModal(true)
                    }}
                    className="w-full"
                  >
                    Add Payment
                  </ButtonComponent>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                📋 Payment History
              </h3>
              <div className="flex flex-wrap gap-2">
                <ButtonComponent
                  variant={filter === 'ALL' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('ALL')}
                >
                  All
                </ButtonComponent>
                <ButtonComponent
                  variant={filter === 'DUE' ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('DUE')}
                >
                  Dues
                </ButtonComponent>
                <ButtonComponent
                  variant={filter === 'ADVANCE' ? 'success' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('ADVANCE')}
                >
                  Advances
                </ButtonComponent>
                <ButtonComponent
                  variant={filter === 'CLEARED' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('CLEARED')}
                >
                  Cleared
                </ButtonComponent>
              </div>
            </div>
          </div>
          <div className="p-6">

            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No payments found</h3>
                <p className="text-foreground/60">No payment records match the current filter.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {payment.employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.type === 'DUE' 
                                ? 'bg-destructive/15 text-destructive' 
                                : payment.type === 'ADVANCE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : payment.type === 'DUE_CLEARED'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {payment.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatIndianCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {payment.description || 'No description'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatIndianDate(payment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {(!payment.isCleared && (payment.type === 'DUE' || payment.type === 'ADVANCE')) && (
                                <button
                                  onClick={() => handleClearPayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                                  className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                                className="text-destructive hover:text-destructive/80 bg-destructive/15 hover:bg-destructive/25 px-3 py-1 rounded-md text-xs font-medium transition-colors"
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
                    <div key={payment.id} className="bg-muted rounded-lg p-4 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-foreground">{payment.employee.name}</h4>
                          <p className="text-sm text-muted-foreground">{payment.description || 'No description'}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.type === 'DUE' 
                            ? 'bg-destructive/15 text-destructive' 
                            : payment.type === 'ADVANCE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : payment.type === 'DUE_CLEARED'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {payment.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-foreground">{formatIndianCurrency(payment.amount)}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{formatIndianDate(payment.date)}</span>
                          {(!payment.isCleared && (payment.type === 'DUE' || payment.type === 'ADVANCE')) && (
                            <button
                              onClick={() => handleClearPayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id, payment.employee.name, payment.amount, payment.type)}
                            className="text-destructive hover:text-destructive/80 bg-destructive/15 hover:bg-destructive/25 px-2 py-1 rounded-md text-xs font-medium transition-colors"
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
      </div>

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
