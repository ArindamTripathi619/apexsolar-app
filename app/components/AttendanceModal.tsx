'use client'

import { useState } from 'react'

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employeeId: string
  employeeName: string
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName
}: AttendanceModalProps) {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    daysWorked: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'month' || name === 'year' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate days worked
    const daysWorked = parseInt(formData.daysWorked)
    if (isNaN(daysWorked) || daysWorked < 0 || daysWorked > 31) {
      setError('Please enter a valid number of days (0-31)')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId,
          month: parseInt(formData.month.toString()),
          year: parseInt(formData.year.toString()),
          daysWorked
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          daysWorked: ''
        })
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to record attendance')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      daysWorked: ''
    })
    setError('')
    onClose()
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const maxDays = getDaysInMonth(formData.month, formData.year)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Record Attendance for {employeeName}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  Month *
                </label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year *
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="daysWorked" className="block text-sm font-medium text-gray-700">
                Days Worked *
              </label>
              <input
                type="number"
                name="daysWorked"
                id="daysWorked"
                min="0"
                max={maxDays}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`0 - ${maxDays} days`}
                value={formData.daysWorked}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum {maxDays} days in {new Date(0, formData.month - 1).toLocaleString('default', { month: 'long' })} {formData.year}
              </p>
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
                {loading ? 'Recording...' : 'Record Attendance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
