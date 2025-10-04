'use client'

import { useState, useEffect } from 'react'

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

export default function UploadedChallansView() {
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchChallans()
  }, [])

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
    } finally {
      setLoading(false)
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

  const filteredChallans = challans.filter(challan => challan.year === selectedYear)

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Year Filter */}
      <div className="mb-4">
        <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Year:
        </label>
        <select
          id="year-filter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

      {filteredChallans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No challans uploaded for {selectedYear}.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChallans.map((challan) => (
                  <tr key={challan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        challan.type === 'PF' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {challan.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMonthName(challan.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {challan.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(challan.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDownload(challan.fileUrl, challan.fileName)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs"
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
              <div key={challan.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        challan.type === 'PF' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {challan.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {getMonthName(challan.month)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{challan.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded: {new Date(challan.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(challan.fileUrl, challan.fileName)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md text-xs font-medium"
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
  )
}
