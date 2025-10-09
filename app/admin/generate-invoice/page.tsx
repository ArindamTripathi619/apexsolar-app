'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InvoiceGenerationForm from '@/app/components/InvoiceGenerationForm'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

export default function GenerateInvoicePage() {
  const router = useRouter()

  useEffect(() => {
    // Check authentication
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
      }
    }

    checkAuth()
  }, [router])

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
                Generate Invoice
              </h1>
              <p className="text-foreground/60 mt-1">Create professional invoices for solar projects</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="outline" 
              size="md"
              onClick={() => router.push('/admin/invoices')}
            >
              View All Invoices
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
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                  })
                  router.push('/admin/login')
                } catch (err) {
                  console.error('Logout failed:', err)
                }
              }}
            >
              Logout
            </ButtonComponent>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <InvoiceGenerationForm />
        </div>
      </div>
    </div>
  )
}
