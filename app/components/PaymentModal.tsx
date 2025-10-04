'use client'

import { useState } from 'react'
import { PaymentType } from '@prisma/client'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employeeId: string
  employeeName: string
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName
}: PaymentModalProps) {
  const [formData, setFormData] = useState({
    type: 'DUE' as PaymentType,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate amount
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId,
          type: formData.type,
          amount,
          description: formData.description || undefined,
          date: formData.date
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          type: 'DUE',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to add payment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      type: 'DUE',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add Payment for {employeeName}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Payment Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DUE">Due (Amount owed by employee)</option>
                <option value="ADVANCE">Advance (Amount paid to employee)</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                id="amount"
                step="0.01"
                min="0"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

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
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
