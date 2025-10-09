'use client'

import { useState, useEffect } from 'react'
import { formatIndianDate } from '@/app/lib/indianLocalization'
import { DocumentCategory } from '@prisma/client'

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  category: DocumentCategory
  uploadedBy: string
  uploadedFor?: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  uploader: {
    id: string
    email: string
    role: string
  }
}

interface DocumentViewerProps {
  userRole?: string
  refreshTrigger?: number
}

const CATEGORY_LABELS = {
  GENERAL: 'General',
  FINANCIAL: 'Financial',
  LEGAL: 'Legal',
  HR: 'HR',
  COMPLIANCE: 'Compliance',
  CONTRACTS: 'Contracts',
  INVOICES: 'Invoices',
  REPORTS: 'Reports',
  POLICIES: 'Policies',
  CERTIFICATES: 'Certificates'
}

const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-100 text-gray-800',
  FINANCIAL: 'bg-green-100 text-green-800',
  LEGAL: 'bg-red-100 text-red-800',
  HR: 'bg-blue-100 text-blue-800',
  COMPLIANCE: 'bg-yellow-100 text-yellow-800',
  CONTRACTS: 'bg-purple-100 text-purple-800',
  INVOICES: 'bg-indigo-100 text-indigo-800',
  REPORTS: 'bg-pink-100 text-pink-800',
  POLICIES: 'bg-orange-100 text-orange-800',
  CERTIFICATES: 'bg-teal-100 text-teal-800'
}

export default function DocumentViewer({ userRole, refreshTrigger }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    tags: '',
    isPublic: ''
  })

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.tags) params.append('tags', filters.tags)
      if (filters.isPublic) params.append('isPublic', filters.isPublic)

      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        setDocuments(result.data)
      } else {
        setError(result.error || 'Failed to fetch documents')
      }
    } catch (error) {
      setError('Failed to fetch documents')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [filters, refreshTrigger])

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include',
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        fetchDocuments() // Refresh the list
      } else {
        alert(result.error || 'Failed to delete document')
      }
    } catch (error) {
      alert('Failed to delete document')
      console.error('Delete error:', error)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return '📄'
    if (mimeType.includes('pdf')) return '📕'
    if (mimeType.includes('word')) return '📘'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📝'
    return '📄'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Filter Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              value={filters.tags}
              onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by tags..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Visibility
            </label>
            <select
              value={filters.isPublic}
              onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Documents</option>
              <option value="true">Public Documents</option>
              <option value="false">Private Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow border border-border">
          <div className="text-muted-foreground text-lg">No documents found</div>
          <div className="text-muted-foreground text-sm mt-2">
            {userRole === 'ADMIN' || userRole === 'ACCOUNTANT' 
              ? 'Upload your first document to get started'
              : 'No documents have been shared yet'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <div key={document.id} className="bg-card rounded-lg shadow border border-border hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getFileIcon(document.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {document.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(document.fileSize)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {(userRole === 'ADMIN' || document.uploader.id === userRole) && (
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="text-destructive hover:text-destructive/80 text-sm"
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Category & Visibility */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[document.category]}`}>
                    {CATEGORY_LABELS[document.category]}
                  </span>
                  {document.isPublic ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>

                {/* Description */}
                {document.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}

                {/* Tags */}
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="inline-block text-primary text-xs px-2 py-1">
                        +{document.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By: {document.uploader.email}</span>
                    <span>{formatIndianDate(new Date(document.createdAt))}</span>
                  </div>
                  
                  {/* Download Button */}
                  <a
                    href={document.fileUrl}
                    download={document.fileName}
                    className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-primary/30 shadow-sm text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    📥 Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
