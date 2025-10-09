'use client'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName: string
  loading?: boolean
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card">
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-destructive/15 rounded-full">
            <div className="w-6 h-6 text-destructive">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {message}
            </p>
          </div>

          {itemName && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm font-medium text-foreground">
                {itemName}
              </p>
            </div>
          )}

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
