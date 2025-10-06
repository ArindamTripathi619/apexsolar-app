'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import DocumentViewer from '@/app/components/DocumentViewer'

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload, manage, and organize company documents
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📤 Upload Document
            </button>
          </div>
        </div>

        {/* Documents Section */}
        <div className="px-4 sm:px-0">
          <DocumentViewer 
            userRole="ADMIN"
            refreshTrigger={refreshTrigger}
          />
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
