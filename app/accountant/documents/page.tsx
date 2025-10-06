'use client'

import React, { useState } from 'react'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import DocumentViewer from '@/app/components/DocumentViewer'

export default function AccountantDocumentsPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload documents and view shared documents
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
