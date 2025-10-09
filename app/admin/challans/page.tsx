'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatIndianDate } from '@/app/lib/indianLocalization'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import ButtonComponent from '@/app/components/ui/ButtonComponent'

interface User {
  id: string
  email: string
  role: string
}

interface Challan {
  id: string
  month: number
  year: number
  type: 'PF' | 'ESI'
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
}

export default function AdminChallans() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedType, setSelectedType] = useState('ALL')

  useEffect(() => {
    checkAuth()
    fetchChallans()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success && data.data.role === 'ADMIN') {
        setUser(data.data)
      } else {
        router.push('/admin/login')
      }
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchChallans = async () => {
    try {
      const response = await fetch('/api/challans', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChallans(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch challans:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/admin/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredChallans = challans.filter(challan => {
    const monthMatch = selectedMonth === 0 || challan.month === selectedMonth
    const yearMatch = challan.year === selectedYear
    const typeMatch = selectedType === 'ALL' || challan.type === selectedType
    return monthMatch && yearMatch && typeMatch
  })

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading challans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                PF/ESI Challans
              </h1>
              <p className="text-foreground/60 mt-1">View uploaded PF and ESI challans</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <ThemeToggle />
            <ButtonComponent 
              variant="outline" 
              size="md"
              onClick={() => router.push('/admin/dashboard')}
            >
              Back to Dashboard
            </ButtonComponent>
            <ButtonComponent 
              variant="danger" 
              size="md"
              onClick={handleLogout}
            >
              Logout
            </ButtonComponent>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card shadow-sm rounded-lg mb-6 border border-border">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-foreground">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value={0}>All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-foreground">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
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
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-foreground">
                  Type
                </label>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="ALL">All Types</option>
                  <option value="PF">PF Only</option>
                  <option value="ESI">ESI Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Challans Table */}
        <div className="bg-card shadow-sm rounded-lg border border-border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
              Uploaded Challans ({filteredChallans.length})
            </h3>
            
            {filteredChallans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No challans found for the selected filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Month/Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Uploaded At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredChallans.map((challan) => (
                        <tr key={challan.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              challan.type === 'PF' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {challan.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {getMonthName(challan.month)} {challan.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {challan.fileName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatIndianDate(new Date(challan.uploadedAt))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDownload(challan.fileUrl, challan.fileName)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 px-3 py-1 rounded-md text-xs"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {filteredChallans.map((challan) => (
                    <div key={challan.id} className="bg-muted rounded-lg p-4 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              challan.type === 'PF' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {challan.type}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {getMonthName(challan.month)} {challan.year}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{challan.fileName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploaded: {formatIndianDate(new Date(challan.uploadedAt))}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(challan.fileUrl, challan.fileName)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 px-3 py-2 rounded-md text-xs font-medium"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
