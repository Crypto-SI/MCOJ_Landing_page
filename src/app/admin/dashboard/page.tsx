'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth !== 'true') {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
        <div className="text-xl text-yellow-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 text-yellow-400">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Admin Dashboard</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('mcoj_admin_authenticated')
            router.push('/admin/login')
          }}
          className="bg-red-800 hover:bg-red-900 text-yellow-400 px-4 py-2 rounded-md"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gallery Management Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Gallery Management</h2>
          <p className="text-yellow-300 mb-4">
            Add, remove, or reorder images in the gallery section of your website.
          </p>
          <Link 
            href="/admin/gallery"
            className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
          >
            Manage Gallery
          </Link>
        </div>

        {/* Stats Card - Placeholder for future functionality */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Website Statistics</h2>
          <p className="text-yellow-300 mb-4">
            View website visitor statistics and analytics (coming soon).
          </p>
          <button 
            className="inline-block bg-gray-700 text-gray-300 px-4 py-2 rounded-md cursor-not-allowed"
            disabled
          >
            Coming Soon
          </button>
        </div>

        {/* Settings Card - Placeholder for future functionality */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Website Settings</h2>
          <p className="text-yellow-300 mb-4">
            Manage website settings and configurations (coming soon).
          </p>
          <button 
            className="inline-block bg-gray-700 text-gray-300 px-4 py-2 rounded-md cursor-not-allowed"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-md mt-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-700 p-4 rounded-md bg-black">
            <p className="text-yellow-300 text-sm">Total Gallery Images</p>
            <p className="text-2xl font-bold text-yellow-400">0</p>
          </div>
          <div className="border border-gray-700 p-4 rounded-md bg-black">
            <p className="text-yellow-300 text-sm">Upcoming Events</p>
            <p className="text-2xl font-bold text-yellow-400">0</p>
          </div>
          <div className="border border-gray-700 p-4 rounded-md bg-black">
            <p className="text-yellow-300 text-sm">New Booking Requests</p>
            <p className="text-2xl font-bold text-yellow-400">0</p>
          </div>
        </div>
      </div>
    </div>
  )
} 