'use client'

import React, { useState } from 'react'
import { DocumentCategory } from '@prisma/client'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onDocumentUploaded: () => void
  userRole?: string
}

const DOCUMENT_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'HR', label: 'HR' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'CONTRACTS', label: 'Contracts' },
  { value: 'INVOICES', label: 'Invoices' },
  { value: 'REPORTS', label: 'Reports' },
  { value: 'POLICIES', label: 'Policies' },
  { value: 'CERTIFICATES', label: 'Certificates' }
]

export default function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onDocumentUploaded,
  userRole
}: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL' as DocumentCategory,
    uploadedFor: '',
    tags: '',
    isPublic: false,
    file: null as File | null
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, file }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.file || !formData.title.trim()) {
      setError('File and title are required')
      return
    }

    setUploading(true)

    try {
      const submitData = new FormData()
      submitData.append('file', formData.file)
      submitData.append('title', formData.title.trim())
      submitData.append('description', formData.description.trim())
      submitData.append('category', formData.category)
      submitData.append('uploadedFor', formData.uploadedFor.trim())
      submitData.append('tags', formData.tags.trim())
      submitData.append('isPublic', formData.isPublic.toString())

      const response = await fetch('/api/documents', {
        credentials: 'include',
        method: 'POST',
        body: submitData
      })

      const result = await response.json()

      if (result.success) {
        onDocumentUploaded()
        onClose()
        setFormData({
          title: '',
          description: '',
          category: 'GENERAL',
          uploadedFor: '',
          tags: '',
          isPublic: false,
          file: null
        })
      } else {
        setError(result.error || 'Failed to upload document')
      }
    } catch (error) {
      setError('Failed to upload document')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Upload Document</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              File *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supported: PDF, Word, Excel, Text, Images (max 10MB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter document title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter document description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as DocumentCategory }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-muted-foreground mt-1">
              e.g., urgent, quarterly, confidential
            </p>
          </div>

          {userRole === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload For (Optional)
              </label>
              <input
                type="text"
                value={formData.uploadedFor}
                onChange={(e) => setFormData(prev => ({ ...prev, uploadedFor: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Specific user/employee ID"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-foreground">
              Make this document public (visible to all users)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md border border-border"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !formData.file || !formData.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-md"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
