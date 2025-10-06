'use client'

import { useState, useEffect } from 'react'
import { indianDateToISO, isoToIndianDate } from '@/app/lib/indianLocalization'

interface IndianDateInputProps {
  id?: string
  name?: string
  value: string // This should be in YYYY-MM-DD format (ISO)
  onChange: (value: string) => void // This will return YYYY-MM-DD format (ISO)
  className?: string
  required?: boolean
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function IndianDateInput({
  id,
  name,
  value,
  onChange,
  className = '',
  required = false,
  label,
  placeholder = 'dd/mm/yyyy',
  disabled = false
}: IndianDateInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [error, setError] = useState('')

  // Convert ISO value to Indian format for display
  useEffect(() => {
    if (value) {
      setDisplayValue(isoToIndianDate(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    setError('')

    // If empty, call onChange with empty string
    if (!inputValue.trim()) {
      onChange('')
      return
    }

    // Validate DD/MM/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = inputValue.match(dateRegex)

    if (match) {
      const [, day, month, year] = match
      const dayNum = parseInt(day, 10)
      const monthNum = parseInt(month, 10)
      const yearNum = parseInt(year, 10)

      // Validate date ranges
      if (dayNum < 1 || dayNum > 31) {
        setError('Day must be between 1 and 31')
        return
      }
      if (monthNum < 1 || monthNum > 12) {
        setError('Month must be between 1 and 12')
        return
      }
      if (yearNum < 1900 || yearNum > 2100) {
        setError('Year must be between 1900 and 2100')
        return
      }

      // Check if the date is valid
      const testDate = new Date(yearNum, monthNum - 1, dayNum)
      if (testDate.getDate() !== dayNum || testDate.getMonth() !== monthNum - 1 || testDate.getFullYear() !== yearNum) {
        setError('Please enter a valid date')
        return
      }

      // Convert to ISO format and call onChange
      const isoDate = indianDateToISO(inputValue)
      onChange(isoDate)
    } else if (inputValue.length >= 8) {
      // Only show error if user has typed enough characters
      setError('Please use DD/MM/YYYY format')
    }
  }

  const handleBlur = () => {
    // Auto-format the date if it's partial but valid
    if (displayValue && !error) {
      const parts = displayValue.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        setDisplayValue(formattedDate)
      }
    }
  }

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">Format: DD/MM/YYYY (e.g., 15/03/2024)</p>
    </div>
  )
}
