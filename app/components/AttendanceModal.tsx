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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">
              Record Attendance for {employeeName}
            </h3>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
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
                <label htmlFor="month" className="block text-sm font-medium text-foreground">
                  Month *
                </label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
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
                <label htmlFor="year" className="block text-sm font-medium text-foreground">
                  Year *
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
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
              <label htmlFor="daysWorked" className="block text-sm font-medium text-foreground">
                Days Worked *
              </label>
              <input
                type="number"
                name="daysWorked"
                id="daysWorked"
                min="0"
                max={maxDays}
                required
                className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                placeholder={`0 - ${maxDays} days`}
                value={formData.daysWorked}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum {maxDays} days in {new Date(0, formData.month - 1).toLocaleString('default', { month: 'long' })} {formData.year}
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
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
