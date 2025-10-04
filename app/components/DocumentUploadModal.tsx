'use client'

import { useState } from 'react'
import { DocumentType } from '@prisma/client'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employeeId: string
  employeeName: string
}

const DOCUMENT_TYPES = [
  { value: 'PROFILE_PHOTO', label: 'Profile Photo' },
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
  { value: 'PF_DETAILS', label: 'PF Details' },
  { value: 'ESI_DETAILS', label: 'ESI Details' }
]

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('PROFILE_PHOTO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed')
        return
      }
      
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('employeeId', employeeId)
      formData.append('documentType', documentType)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setSelectedFile(null)
        setUploadProgress(100)
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setError('')
    setUploadProgress(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Document for {employeeName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                Document Type *
              </label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Select File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-600">Uploading...</span>
                </div>
                {uploadProgress > 0 && (
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
