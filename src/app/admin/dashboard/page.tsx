'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ErrorBoundary from '@/components/ErrorBoundary'
import SimpleStorageStats from '@/components/SimpleStorageStats'

// Event type definition
interface Event {
  id: string;
  date: string;
  venue: string;
  eventName: string;
  address: string;
  timeStart: string;
  timeEnd: string;
  ticketLink: string;
  position: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [galleryCount, setGalleryCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth !== 'true') {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
      // Fetch events and gallery counts
      fetchEvents()
    }
    setIsLoading(false)
  }, [router])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  // Helper to determine if an event is upcoming
  const isUpcomingEvent = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to beginning of today
    return eventDate >= today
  }

  // Count upcoming events
  const upcomingEventsCount = events.filter(event => isUpcomingEvent(event.date)).length

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
          onClick={async () => {
            // Clear localStorage
            localStorage.removeItem('mcoj_admin_authenticated')
            
            // Call logout API to clear cookie
            try {
              await fetch('/api/admin/auth/logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
            } catch (err) {
              console.error('Logout error:', err);
            }
            
            // Redirect to login page
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

        {/* Events Management Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Events Management</h2>
          <p className="text-yellow-300 mb-4">
            Add, edit, or remove upcoming events displayed on your website.
          </p>
          <Link 
            href="/admin/events"
            className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
          >
            Manage Events
          </Link>
        </div>

        {/* Videos Management Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Videos Management</h2>
          <p className="text-yellow-300 mb-4">
            Add, edit, or remove videos in the video gallery section of your website.
          </p>
          <Link 
            href="/admin/videos"
            className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
          >
            Manage Videos
          </Link>
        </div>
        
        {/* Database Management Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Database Management</h2>
          <p className="text-yellow-300 mb-4">
            Monitor your Supabase storage usage and manage database resources.
          </p>
          <ErrorBoundary fallback={
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-yellow-300 font-bold">Storage Statistics</p>
              <p className="text-yellow-200 mt-2">
                Unable to load storage statistics. All required buckets have been created:
              </p>
              <ul className="list-disc pl-5 mt-2 text-yellow-200">
                <li>videos: Stores uploaded video files</li>
                <li>gallery: Stores gallery images (public)</li>
                <li>thumbnails: Stores video thumbnails (public)</li>
                <li>temp: Temporary storage during file processing</li>
                <li>events: Stores event-related files</li>
                <li>bookings: Stores booking request attachments</li>
              </ul>
            </div>
          }>
            <SimpleStorageStats />
          </ErrorBoundary>
          
          <div className="mt-6">
            <Link 
              href="/admin/migrate"
              className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
            >
              Data Migration Tool
            </Link>
            <p className="mt-2 text-sm text-yellow-300">
              Migrate your JSON data to Supabase storage buckets and tables.
            </p>
          </div>
        </div>
        
        {/* Image Optimizer Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Image Optimizer</h2>
          <p className="text-yellow-300 mb-4">
            Optimize your images with TinyPNG compression. Reduce file sizes while maintaining quality.
          </p>
          <Link 
            href="/admin/optimize"
            className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
          >
            Optimize Images
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
        
        {/* Debug Tools Card */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Debug Tools</h2>
          <p className="text-yellow-300 mb-4">
            Troubleshoot storage and upload issues. Test Supabase connection and bucket access.
          </p>
          <Link 
            href="/admin/debug"
            className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors font-bold"
          >
            Open Debug Tools
          </Link>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-md mt-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-700 p-4 rounded-md bg-black">
            <p className="text-yellow-300 text-sm">Total Gallery Images</p>
            <p className="text-2xl font-bold text-yellow-400">{galleryCount}</p>
          </div>
          <div className="border border-gray-700 p-4 rounded-md bg-black">
            <p className="text-yellow-300 text-sm">Upcoming Events</p>
            <p className="text-2xl font-bold text-yellow-400">{upcomingEventsCount}</p>
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