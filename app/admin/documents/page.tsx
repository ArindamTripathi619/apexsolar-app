'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import DocumentViewer from '@/app/components/DocumentViewer'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

export default function AdminDocumentsPage() {
  const router = useRouter()

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
      if (!data.success || data.data.role !== 'ADMIN') {
        router.push('/admin/login')
      }
    } catch (err) {
      router.push('/admin/login')
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDocumentUploaded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Document Management
              </h1>
              <p className="text-foreground/60 mt-1">Upload, manage, and organize company documents</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="primary" 
              size="md"
              onClick={() => setIsUploadModalOpen(true)}
            >
              📤 Upload Document
            </ButtonComponent>
            <ButtonComponent 
              variant="outline" 
              size="md"
              onClick={() => router.push('/admin/dashboard')}
            >
              ← Back to Dashboard
            </ButtonComponent>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground">Company Documents</h3>
          </div>
          <div className="p-6">
            <DocumentViewer 
              userRole="ADMIN"
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onDocumentUploaded={handleDocumentUploaded}
          userRole="ADMIN"
        />
      </div>
    </div>
  )
}
