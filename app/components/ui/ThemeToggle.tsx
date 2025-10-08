'use client'

import React from 'react'
import { useTheme } from '@/app/contexts/ThemeContext'
import { Moon, Sun, Monitor } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown'
  showLabel?: boolean
  className?: string
}

export default function ThemeToggle({ 
  variant = 'button', 
  showLabel = false,
  className = '' 
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center gap-2 px-3 py-2 
        bg-white dark:bg-slate-800 
        border border-gray-300 dark:border-slate-600 
        rounded-md shadow-sm 
        text-gray-700 dark:text-slate-300 
        hover:bg-gray-50 dark:hover:bg-slate-700 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        transition-colors duration-200
        ${className}
      `}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolvedTheme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {resolvedTheme === 'light' ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </button>
  )
}
