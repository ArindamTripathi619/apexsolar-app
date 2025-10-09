'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InvoiceModal from '@/app/components/InvoiceModal'
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal'
import { formatIndianCurrency, formatIndianDate } from '@/app/lib/indianLocalization'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

interface User {
  id: string
  email: string
  role: string
}

interface Invoice {
  id: string
  clientName: string
  amount: number
  date: string
  fileName: string
  fileUrl: string
  createdAt: string
}

export default function InvoiceManagement() {
  const router = useRouter()
  const [_user, setUser] = useState<User | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null) // Track which invoice is being deleted
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [filters, setFilters] = useState({
    clientName: '',
    startDate: '',
    endDate: ''
  })

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
    } catch (_err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.clientName) queryParams.append('clientName', filters.clientName)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await fetch(`/api/invoices/stats?${queryParams.toString()}`, {
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
  }, [filters.clientName, filters.startDate, filters.endDate])

  const fetchInvoices = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.clientName) queryParams.append('clientName', filters.clientName)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await fetch(`/api/invoices?${queryParams.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInvoices(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }, [filters.clientName, filters.startDate, filters.endDate])

  useEffect(() => {
    checkAuth()
    fetchStats()
    fetchInvoices()
  }, [checkAuth, fetchInvoices, fetchStats])

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInvoices()
  }

  const handleViewInvoice = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  const handleDeleteInvoice = async (invoiceId: string, _clientName: string, _amount: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return
    
    setInvoiceToDelete(invoice)
    setShowDeleteModal(true)
  }

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return

    setDeleting(invoiceToDelete.id)

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // Remove the deleted invoice from the state
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceToDelete.id))
        
        // Close the modal
        setShowDeleteModal(false)
        setInvoiceToDelete(null)
        
        // Show success message
        alert(`Invoice for ${invoiceToDelete.clientName} (${formatIndianCurrency(invoiceToDelete.amount)}) has been deleted successfully.`)
      } else {
        alert(`Failed to delete invoice: ${data.error}`)
      }
    } catch (error) {
      console.error('Delete invoice error:', error)
      alert('An unexpected error occurred while deleting the invoice.')
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handleSelectAllInvoices = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(invoices.map(invoice => invoice.id))
    }
  }

  const handleBulkDeleteInvoices = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to delete')
      return
    }

    const selectedCount = selectedInvoices.length
    const confirmed = confirm(`Are you sure you want to delete ${selectedCount} selected invoice${selectedCount > 1 ? 's' : ''}?`)
    
    if (!confirmed) return

    setBulkDeleting(true)

    try {
      const response = await fetch('/api/invoices/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ invoiceIds: selectedInvoices })
      })

      const data = await response.json()

      if (data.success) {
        // Remove deleted invoices from state
        setInvoices(prev => prev.filter(invoice => !selectedInvoices.includes(invoice.id)))
        setSelectedInvoices([])
        alert(`Successfully deleted ${data.deletedCount} invoice${data.deletedCount > 1 ? 's' : ''}`)
      } else {
        alert(`Failed to delete invoices: ${data.error}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('An unexpected error occurred while deleting invoices.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const [stats, setStats] = useState({ totalInvoiceAmount: 0, totalPaidAmount: 0, totalDueAmount: 0, invoiceCount: 0 })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading invoice data...</p>
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
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Invoice Management
              </h1>
              <p className="text-foreground/60 mt-1">View and manage uploaded invoices</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="success" 
              size="md"
              onClick={() => setShowInvoiceModal(true)}
            >
              Upload Invoice
            </ButtonComponent>
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
        {/* Summary Card */}
        <div className="mb-8">
          <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Total Due Amount</dt>
                    <dd className="text-lg font-medium text-foreground">{formatIndianCurrency(stats.totalDueAmount)}</dd>
                  </dl>
                </div>
                <div className="ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Total Invoices</dt>
                    <dd className="text-lg font-medium text-foreground">{invoices.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card shadow-sm rounded-lg mb-6 border border-border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Filter Invoices</h3>
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-foreground">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    id="clientName"
                    className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Search by client name"
                    value={filters.clientName}
                    onChange={handleFilterChange}
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
            {(filters.clientName || filters.startDate || filters.endDate) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setFilters({ clientName: '', startDate: '', endDate: '' })
                    fetchInvoices()
                  }}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-card shadow-sm rounded-lg border border-border">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground">Invoices</h3>
              {selectedInvoices.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{selectedInvoices.length} selected</span>
                  <button
                    onClick={handleBulkDeleteInvoices}
                    disabled={bulkDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                  >
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </button>
                  <button
                    onClick={() => setSelectedInvoices([])}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No invoices found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                            onChange={handleSelectAllInvoices}
                            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Client Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Invoice Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {invoices.map((invoice) => (
                        <tr 
                          key={invoice.id}
                          className={selectedInvoices.includes(invoice.id) ? 'bg-primary/5' : ''}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleSelectInvoice(invoice.id)}
                              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {invoice.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatIndianCurrency(invoice.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatIndianDate(new Date(invoice.date))}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            <span className="truncate max-w-xs block" title={invoice.fileName}>
                              {invoice.fileName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatIndianDate(new Date(invoice.createdAt))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewInvoice(invoice.fileUrl)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 border border-blue-200 dark:border-blue-800 rounded"
                              >
                                View PDF
                              </button>
                              <a
                                href={invoice.fileUrl}
                                download={invoice.fileName}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-xs px-2 py-1 border border-green-200 dark:border-green-800 rounded"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id, invoice.clientName, invoice.amount)}
                                disabled={deleting === invoice.id}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-xs px-2 py-1 border border-red-200 dark:border-red-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleting === invoice.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className={`rounded-lg p-4 border ${selectedInvoices.includes(invoice.id) ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="h-4 w-4 text-primary focus:ring-primary border-border rounded mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-foreground mb-1">{invoice.clientName}</h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Amount:</span> {formatIndianCurrency(invoice.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Invoice Date:</span> {formatIndianDate(new Date(invoice.date))}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">File:</span> {invoice.fileName.length > 25 ? invoice.fileName.substring(0, 25) + '...' : invoice.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {formatIndianDate(new Date(invoice.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.fileUrl)}
                          className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded font-medium"
                        >
                          📄 View PDF
                        </button>
                        <a
                          href={invoice.fileUrl}
                          download={invoice.fileName}
                          className="w-full text-center bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded font-medium flex items-center justify-center"
                        >
                          💾 Download
                        </a>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.clientName, invoice.amount)}
                          disabled={deleting === invoice.id}
                          className="w-full text-center bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === invoice.id ? '⏳ Deleting...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={() => {
          setShowInvoiceModal(false)
          fetchInvoices()
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setInvoiceToDelete(null)
        }}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice?"
        itemName={invoiceToDelete ? `${invoiceToDelete.clientName} - ${formatIndianCurrency(invoiceToDelete.amount)} (${formatIndianDate(new Date(invoiceToDelete.date))})` : ''}
        loading={!!deleting}
      />
    </div>
  )
}
