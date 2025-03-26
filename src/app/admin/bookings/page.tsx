'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookingRequest } from '@/utils/bookingUtils'

// Status options for booking requests
const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-orange-500' },
  { value: 'booked', label: 'Booked', color: 'bg-green-500' },
  { value: 'declined', label: 'Declined', color: 'bg-red-500' },
  { value: 'canceled', label: 'Canceled', color: 'bg-gray-500' },
]

export default function BookingsAdmin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth !== 'true') {
      router.push('/admin/login')
    }
  }, [router])

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/bookings?' + new URLSearchParams({
          ...(filterStatus && { status: filterStatus }),
          ...(startDate && { fromDate: startDate }),
          ...(endDate && { toDate: endDate }),
        }))
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setBookings(data.data)
        } else {
          setError(data.error || 'Unknown error')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error')
        console.error('Error fetching bookings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBookings()
  }, [filterStatus, startDate, endDate])

  // Format date in human readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Format time in 12-hour format
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not specified'
    
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours, 10)
      const meridiem = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${meridiem}`
    } catch (error) {
      return timeString
    }
  }

  // Handle status update
  const updateBookingStatus = async (id: string, status: string) => {
    try {
      setIsUpdating(id)
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the booking status in the local state
        setBookings(prev => 
          prev.map(booking => 
            booking.id === id 
              ? { ...booking, status: status as BookingRequest['status'] } 
              : booking
          )
        )
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
      console.error('Error updating booking status:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  // Handle booking deletion
  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking request? This cannot be undone.')) {
      return
    }
    
    try {
      setIsUpdating(id)
      const response = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove the booking from the local state
        setBookings(prev => prev.filter(booking => booking.id !== id))
      } else {
        setError(data.error || 'Failed to delete booking')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
      console.error('Error deleting booking:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  // Toggle expanded view for a booking
  const toggleExpandBooking = (id: string) => {
    setExpandedBooking(current => current === id ? null : id)
  }

  // Get status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0]
    
    return (
      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${statusOption.color}`}>
        {statusOption.label}
      </span>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Booking Requests</h1>
        <p className="text-gray-300">
          Manage booking requests from potential clients
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-xl text-yellow-400 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Status</label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 text-white p-4 rounded-lg mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-yellow-400 text-xl">Loading booking requests...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <h3 className="text-xl text-gray-300 mb-2">No booking requests found</h3>
          <p className="text-gray-400">
            {filterStatus || startDate || endDate 
              ? 'Try adjusting your filters to see more results.' 
              : 'When clients submit booking requests, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div 
              key={booking.id} 
              className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800"
            >
              {/* Booking Header */}
              <div 
                className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleExpandBooking(booking.id!)}
              >
                <div className="mb-2 md:mb-0">
                  <h3 className="text-xl text-white font-bold">{booking.name}</h3>
                  <p className="text-gray-400">
                    {booking.email} • {booking.phone || 'No phone'}
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                  <div className="text-right">
                    <p className="text-yellow-400">{booking.venue}</p>
                    <p className="text-gray-400">{formatDate(booking.event_date)}</p>
                  </div>
                  <StatusBadge status={booking.status || 'new'} />
                </div>
              </div>
              
              {/* Expanded Booking Details */}
              {expandedBooking === booking.id && (
                <div className="border-t border-gray-800 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-yellow-400 font-bold mb-2">Contact Information</h4>
                      <p className="text-gray-300"><span className="text-gray-500">Name:</span> {booking.name}</p>
                      <p className="text-gray-300"><span className="text-gray-500">Email:</span> {booking.email}</p>
                      <p className="text-gray-300"><span className="text-gray-500">Phone:</span> {booking.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-bold mb-2">Event Details</h4>
                      <p className="text-gray-300"><span className="text-gray-500">Event Type:</span> {booking.event_type || 'Not specified'}</p>
                      <p className="text-gray-300"><span className="text-gray-500">Date:</span> {formatDate(booking.event_date)}</p>
                      <p className="text-gray-300"><span className="text-gray-500">Time:</span> {formatTime(booking.event_time || '')}</p>
                      <p className="text-gray-300"><span className="text-gray-500">Venue:</span> {booking.venue}</p>
                    </div>
                  </div>
                  
                  {booking.additional_info && (
                    <div className="mb-4">
                      <h4 className="text-yellow-400 font-bold mb-2">Additional Information</h4>
                      <p className="text-gray-300 bg-gray-800 p-3 rounded">{booking.additional_info}</p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <h4 className="text-yellow-400 font-bold mb-2">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateBookingStatus(booking.id!, option.value)}
                          disabled={isUpdating === booking.id || booking.status === option.value}
                          className={`px-3 py-1 rounded text-sm font-medium 
                            ${booking.status === option.value 
                              ? 'bg-gray-700 text-white cursor-default' 
                              : `${option.color} text-white hover:opacity-90`
                            }
                            ${isUpdating === booking.id ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => deleteBooking(booking.id!)}
                        disabled={isUpdating === booking.id}
                        className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 