'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InvoiceModal from '@/app/components/InvoiceModal'
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal'

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
  const [user, setUser] = useState<User | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null) // Track which invoice is being deleted
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [filters, setFilters] = useState({
    clientName: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    checkAuth()
    fetchInvoices()
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

  const fetchInvoices = async () => {
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

  const handleDeleteInvoice = async (invoiceId: string, clientName: string, amount: number) => {
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
        alert(`Invoice for ${invoiceToDelete.clientName} (₹${invoiceToDelete.amount.toFixed(2)}) has been deleted successfully.`)
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

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Invoice Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage uploaded invoices</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
              >
                Upload Invoice
              </button>
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
        {/* Summary Card */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Invoice Amount</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{totalAmount.toFixed(2)}</dd>
                  </dl>
                </div>
                <div className="ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{invoices.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Filter Invoices</h3>
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    id="clientName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by client name"
                    value={filters.clientName}
                    onChange={handleFilterChange}
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Invoices</h3>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No invoices found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{invoice.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="truncate max-w-xs block" title={invoice.fileName}>
                              {invoice.fileName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewInvoice(invoice.fileUrl)}
                                className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded"
                              >
                                View PDF
                              </button>
                              <a
                                href={invoice.fileUrl}
                                download={invoice.fileName}
                                className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-200 rounded"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id, invoice.clientName, invoice.amount)}
                                disabled={deleting === invoice.id}
                                className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div key={invoice.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">{invoice.clientName}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Amount:</span> ₹{invoice.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Invoice Date:</span> {new Date(invoice.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">File:</span> {invoice.fileName.length > 25 ? invoice.fileName.substring(0, 25) + '...' : invoice.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
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
      </main>

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
        itemName={invoiceToDelete ? `${invoiceToDelete.clientName} - ₹${invoiceToDelete.amount.toFixed(2)} (${new Date(invoiceToDelete.date).toLocaleDateString()})` : ''}
        loading={!!deleting}
      />
    </div>
  )
}
