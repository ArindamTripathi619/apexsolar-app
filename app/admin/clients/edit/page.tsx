'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function EditClientForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClient, setIsLoadingClient] = useState(true)
  const [formData, setFormData] = useState({
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    state: '',
    pinCode: '',
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.success) {
        const client = data.clients.find((c: any) => c.id === clientId)
        if (client) {
          setFormData({
            companyName: client.companyName || '',
            addressLine1: client.addressLine1 || '',
            addressLine2: client.addressLine2 || '',
            addressLine3: client.addressLine3 || '',
            city: client.city || '',
            state: client.state || '',
            pinCode: client.pinCode || '',
            gstNumber: client.gstNumber || '',
            panNumber: client.panNumber || '',
            contactPerson: client.contactPerson || '',
            email: client.email || '',
            phone: client.phone || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      alert('Error loading client data')
    } finally {
      setIsLoadingClient(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: clientId,
          ...formData
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Client updated successfully!')
        router.push('/admin/clients')
      } else {
        alert(data.error || 'Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Error updating client')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Edit Client</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update client information</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required Fields */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-foreground mb-1">
                  Address Line 1 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              {/* Optional Fields */}
              <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-foreground mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="addressLine3" className="block text-sm font-medium text-foreground mb-1">
                  Address Line 3
                </label>
                <input
                  type="text"
                  id="addressLine3"
                  name="addressLine3"
                  value={formData.addressLine3}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-foreground mb-1">
                  Pin Code
                </label>
                <input
                  type="text"
                  id="pinCode"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-foreground mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  id="gstNumber"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-foreground mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-foreground mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => router.push('/admin/clients')}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary border border-input rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-colors duration-200"
              >
                {isLoading ? 'Updating...' : 'Update Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function EditClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <EditClientForm />
    </Suspense>
  )
}
