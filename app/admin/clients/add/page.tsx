'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AddClient() {
  const [formData, setFormData] = useState({
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    city: "",
    state: "",
    pinCode: "",
    gstNumber: "",
    panNumber: "",
    contactPerson: "",
    email: "",
    phone: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Authentication check on page load
  useEffect(() => {
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
        if (!data.success || data.data.role !== 'ADMIN') {
          router.push('/admin/login')
          return
        }
      } catch {
        router.push('/admin/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🚀 Starting client creation form submission')
    console.log('📤 Form data being sent:', formData)

    try {
      console.log('📡 Making POST request to /api/clients')
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(formData)
      })

      console.log('📨 Response status:', response.status)
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.status === 401) {
        console.log('🔐 Authentication failed, redirecting to login')
        router.push('/admin/login')
        return
      }

      const responseData = await response.json()
      console.log('📥 Response data:', responseData)

      if (!response.ok) {
        console.error('❌ Request failed:', responseData)
        throw new Error(responseData.error || 'Failed to create client')
      }

      console.log('✅ Client created successfully, redirecting to clients page')
      // Success - redirect to clients page
      router.push('/admin/clients')
    } catch (err: any) {
      console.error('❌ Error in form submission:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow-card border border-border">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
            <p className="text-muted-foreground mt-1">Create a new client for invoice management</p>
          </div>

          {error && (
            <div className="p-6 border-b border-border">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Required Fields */}
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      GST Number *
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      placeholder="GST number"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      PAN Number *
                    </label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      placeholder="10-digit PAN number"
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      title="Please enter a valid PAN number (e.g., ABCTY1234D)"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Address Information</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                    placeholder="Building number, street name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                    placeholder="Area, landmark (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    name="addressLine3"
                    value={formData.addressLine3}
                    onChange={handleChange}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                    placeholder="Additional address information"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      pattern="[0-9]{6}"
                      title="Please enter a valid 6-digit PIN code"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Contact Information (Optional)</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                    placeholder="Primary contact person name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-200"
                      placeholder="10-digit phone number"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => router.push('/admin/clients')}
                className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
