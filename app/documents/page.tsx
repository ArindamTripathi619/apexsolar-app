'use client'

import React, { useState } from 'react'
import DocumentUploadModal from '@/app/components/DocumentUploadModal'
import DocumentViewer from '@/app/components/DocumentViewer'

export default function PublicDocumentsPage() {
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
                View and upload documents
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

        {/* Info Banner */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Document Sharing
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    You can view public documents shared by administrators and accountants. 
                    You can also upload documents that will be visible to administrators and accountants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="px-4 sm:px-0">
          <DocumentViewer 
            userRole="USER"
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onDocumentUploaded={handleDocumentUploaded}
          userRole="USER"
        />
      </div>
    </div>
  )
}
