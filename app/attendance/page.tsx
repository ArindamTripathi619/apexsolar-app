'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AttendancePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/attendance/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  )
}
