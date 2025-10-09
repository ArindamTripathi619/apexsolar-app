'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompanySettings } from '@/app/types/invoice-generation'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CompanySettings>({
    accountName: 'APEX SOLAR',
    bankName: 'STATE BANK OF INDIA',
    ifscCode: 'SBIN0007679',
    accountNumber: '40423372674',
    gstNumber: '19AFZPT2526E1ZV',
    stampSignatureUrl: '',
    companyLogoUrl: ''
  })

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth()
      await fetchSettings()
    }
    initializePage()
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
      if (!data.success || data.data.role !== 'ADMIN') {
        router.push('/admin/login')
      }
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/company-settings', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'stampSignatureUrl' | 'companyLogoUrl') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      alert('File size must be less than 2MB')
      return
    }

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        // Additional check for base64 size
        if (base64.length > 3 * 1024 * 1024) { // ~2.25MB after base64 encoding
          alert('Image is too large after encoding. Please use a smaller image.')
          return
        }
        handleInputChange(field, base64)
      }
      reader.onerror = () => {
        alert('Error reading file')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file')
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      console.log('Saving settings:', {
        ...settings,
        stampSignatureUrl: settings.stampSignatureUrl ? `[${settings.stampSignatureUrl.length} chars]` : 'none',
        companyLogoUrl: settings.companyLogoUrl ? `[${settings.companyLogoUrl.length} chars]` : 'none'
      })

      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      
      console.log('Response status:', response.status)
      console.log('Response data:', data)
      
      if (response.ok && data.success) {
        setSettings(data.data)
        alert('Settings saved successfully!')
      } else {
        const errorMessage = data.error || data.message || `HTTP ${response.status} - ${response.statusText}`
        console.error('Save error:', { response, data, errorMessage })
        alert(`Failed to save settings: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Company Settings
              </h1>
              <p className="text-foreground/60 mt-1">Manage bank details and company information</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="outline" 
              size="md"
              onClick={() => router.push('/admin/dashboard')}
            >
              ← Back to Dashboard
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
        {/* Bank Account Details */}
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              🏦 Bank Account Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={settings.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Images */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              🖼️ Company Images
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stamp & Signature
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'stampSignatureUrl')}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-foreground/60 mt-2">
                  Max size: 2MB. Supported formats: JPG, PNG, GIF
                </p>
                {settings.stampSignatureUrl && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <img
                      src={settings.stampSignatureUrl}
                      alt="Stamp & Signature"
                      className="max-w-full h-32 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'companyLogoUrl')}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-foreground/60 mt-2">
                  Max size: 2MB. Supported formats: JPG, PNG, GIF
                </p>
                {settings.companyLogoUrl && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <img
                      src={settings.companyLogoUrl}
                      alt="Company Logo"
                      className="max-w-full h-32 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <ButtonComponent 
                variant="outline" 
                size="md"
                onClick={() => router.push('/admin/dashboard')}
              >
                Cancel
              </ButtonComponent>
              <ButtonComponent 
                variant="primary" 
                size="md"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </ButtonComponent>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
