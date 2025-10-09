'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import IndianDateInput from './IndianDateInput'

interface Client {
  id: string
  companyName: string
  addressLine1: string
  city?: string
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InvoiceModal({
  isOpen,
  onClose,
  onSuccess
}: InvoiceModalProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients()
    }
  }, [isOpen])

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.clients) {
          setClients(data.clients)
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      // Validate file type (only PDF)
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed for invoices')
        return
      }
      
      setSelectedFile(file)
      setError('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddNewClient = () => {
    // Close the modal and redirect to add client page
    onClose()
    router.push('/admin/clients/add')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a PDF file')
      return
    }

    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Find selected client to get the name
      const selectedClient = clients.find(client => client.id === formData.clientId)
      const clientName = selectedClient ? selectedClient.companyName : ''

      const submitData = new FormData()
      submitData.append('file', selectedFile)
      submitData.append('clientId', formData.clientId)
      submitData.append('clientName', clientName)
      submitData.append('amount', formData.amount)
      submitData.append('date', formData.date)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        credentials: 'include',
        body: submitData
      })

      const result = await response.json()

      if (response.ok) {
        // Reset form
        setSelectedFile(null)
        setFormData({
          clientId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        })
        onSuccess()
      } else {
        setError(result.error || 'Failed to upload invoice')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload invoice')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setFormData({
      clientId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    })
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
        <h2 className="text-xl font-bold mb-4 text-foreground">Upload Invoice</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-foreground mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            {loadingClients ? (
              <div className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                Loading clients...
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} - {client.addressLine1}
                      {client.city && `, ${client.city}`}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={handleAddNewClient}
                  className="w-full px-3 py-2 text-sm text-primary border border-primary/30 rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  + Add New Client
                </button>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter amount"
            />
          </div>

          {/* Date */}
          <div>
            <IndianDateInput
              id="date"
              name="date"
              label="Invoice Date"
              value={formData.date}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                date: value
              }))}
              required
              placeholder="dd/mm/yyyy"
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-foreground mb-1">
              Invoice File (PDF only) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf"
              onChange={handleFileSelect}
              required
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {selectedFile && (
              <p className="mt-1 text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
