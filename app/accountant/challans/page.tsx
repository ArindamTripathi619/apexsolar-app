'use client'

import { useState, useEffect, useCallback } from 'react'
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
  type: 'PF' | 'ESI'
  month: number
  year: number
  fileName: string
  fileUrl: string
  uploadedAt: string
  uploadedBy: {
    email: string
  }
}

export default function ChallanManagement() {
  const router = useRouter()
  const [_user, setUser] = useState<User | null>(null)
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PF' | 'ESI'>('ALL')
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (!response.ok) {
        router.push('/accountant/login')
        return
      }

      const data = await response.json()
      if (data.success && (data.data.role === 'ACCOUNTANT' || data.data.role === 'ADMIN')) {
        setUser(data.data)
      } else {
        router.push('/accountant/login')
      }
    } catch (_err) {
      router.push('/accountant/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchChallans = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    checkAuth()
    fetchChallans()
  }, [checkAuth, fetchChallans])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/accountant/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleViewChallan = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  const filteredChallans = challans.filter(challan => {
    const typeMatch = filter === 'ALL' || challan.type === filter
    const yearMatch = challan.year === yearFilter
    return typeMatch && yearMatch
  })

  const groupedChallans = filteredChallans.reduce((acc, challan) => {
    const key = `${challan.year}-${challan.month}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(challan)
    return acc
  }, {} as Record<string, Challan[]>)

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
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">PF/ESI Challans</h1>
              <p className="text-muted-foreground">View and manage uploaded challan documents</p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <ButtonComponent
                variant="outline"
                size="md"
                onClick={() => router.push('/accountant/dashboard')}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-card shadow-sm rounded-lg mb-6 border border-border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Filter Challans</h3>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-foreground">
                  Type
                </label>
                <select
                  id="type"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'ALL' | 'PF' | 'ESI')}
                  className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="ALL">All Types</option>
                  <option value="PF">PF Challans</option>
                  <option value="ESI">ESI Challans</option>
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-foreground">
                  Year
                </label>
                <select
                  id="year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
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
            </div>
          </div>
        </div>

        {/* Challans List */}
        <div className="bg-card shadow-sm rounded-lg border border-border">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Uploaded Challans - {yearFilter}
              </h3>
              <div className="text-sm text-muted-foreground">
                Total: {filteredChallans.length} documents
              </div>
            </div>

            {Object.keys(groupedChallans).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No challans found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedChallans)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([monthYear, monthChallans]) => {
                    const [year, month] = monthYear.split('-')
                    const monthName = new Date(0, parseInt(month) - 1).toLocaleString('default', { month: 'long' })
                    
                    return (
                      <div key={monthYear} className="border border-border rounded-lg p-4">
                        <h4 className="text-lg font-medium text-foreground mb-4">
                          {monthName} {year}
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {monthChallans.map((challan) => (
                            <div key={challan.id} className="border border-border rounded-lg p-4 hover:bg-muted/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                    challan.type === 'PF' ? 'bg-blue-500' : 'bg-green-500'
                                  }`}>
                                    {challan.type}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {challan.type} Challan
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {challan.fileName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Uploaded by {challan.uploadedBy.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatIndianDate(new Date(challan.uploadedAt))}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewChallan(challan.fileUrl)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 border border-blue-200 dark:border-blue-800 rounded"
                                  >
                                    View
                                  </button>
                                  <a
                                    href={challan.fileUrl}
                                    download={challan.fileName}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-xs px-2 py-1 border border-green-200 dark:border-green-800 rounded"
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
