'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import DocumentViewer from '@/app/components/DocumentViewer'

export default function AccountantDocumentsPage() {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDocumentUploaded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documents</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload documents and view shared documents
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/accountant/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                📤 Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="px-4 sm:px-0">
          <DocumentViewer 
            userRole="ACCOUNTANT"
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onDocumentUploaded={handleDocumentUploaded}
          userRole="ACCOUNTANT"
        />
      </div>
    </div>
  )
}
