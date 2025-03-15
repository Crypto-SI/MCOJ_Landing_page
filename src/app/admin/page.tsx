'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoot() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth === 'true') {
      // If authenticated, redirect to dashboard
      router.push('/admin/dashboard')
    } else {
      // Otherwise, redirect to login
      router.push('/admin/login')
    }
  }, [router])

  // Display a loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
      <div className="text-xl">Redirecting...</div>
    </div>
  )
} 