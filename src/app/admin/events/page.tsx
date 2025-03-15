'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { emptyEvent, fetchEvents, addEvent, updateEvent, deleteEvent, formatDisplayDate, formatDisplayTime } from '@/utils/eventsClientUtils'
import { Event } from '@/utils/eventsUtils'

export default function EventsAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({...emptyEvent})
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Event, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth !== 'true') {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
      loadEvents()
    }
    setIsLoading(false)
  }, [router])

  const loadEvents = async () => {
    setIsLoading(true)
    const eventsList = await fetchEvents()
    setEvents(eventsList)
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field if it exists
    if (formErrors[name as keyof Event]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = () => {
    const errors: Partial<Record<keyof Event, string>> = {}
    let isValid = true

    // Required fields validation
    if (!newEvent.eventName.trim()) {
      errors.eventName = 'Event name is required'
      isValid = false
    }

    if (!newEvent.date.trim()) {
      errors.date = 'Date is required'
      isValid = false
    }

    if (!newEvent.venue.trim()) {
      errors.venue = 'Venue is required'
      isValid = false
    }

    if (!newEvent.address.trim()) {
      errors.address = 'Address is required'
      isValid = false
    }

    if (!newEvent.timeStart.trim()) {
      errors.timeStart = 'Start time is required'
      isValid = false
    }

    if (!newEvent.timeEnd.trim()) {
      errors.timeEnd = 'End time is required'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleLoadEventForEdit = (eventId: string) => {
    const eventToEdit = events.find(event => event.id === eventId)
    if (eventToEdit) {
      // Create a copy of the event without the ID
      const { id, ...eventWithoutId } = eventToEdit
      setNewEvent(eventWithoutId)
      setEditingEventId(eventId)
      setStatusMessage('Editing event. Make your changes and click "Update Event".')
    }
  }

  const handleCancelEdit = () => {
    setNewEvent({...emptyEvent})
    setEditingEventId(null)
    setStatusMessage('')
    setFormErrors({})
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      if (editingEventId) {
        // Update existing event
        setStatusMessage('Updating event...')
        const updatedEvent = await updateEvent(editingEventId, newEvent)
        
        if (updatedEvent) {
          // Update the events list
          setEvents(prev => prev.map(event => 
            event.id === editingEventId ? updatedEvent : event
          ))
          setNewEvent({...emptyEvent}) // Reset form
          setEditingEventId(null) // Exit edit mode
          setStatusMessage('Event updated successfully!')
        } else {
          setStatusMessage('Failed to update event. Please try again.')
        }
      } else {
        // Add new event
        setStatusMessage('Adding event...')
        // Clone newEvent and assign next position
        const eventToAdd = {
          ...newEvent,
          position: events.length + 1
        }

        const addedEvent = await addEvent(eventToAdd)
        
        if (addedEvent) {
          setEvents(prev => [...prev, addedEvent])
          setNewEvent({...emptyEvent}) // Reset form
          setStatusMessage('Event added successfully!')
        } else {
          setStatusMessage('Failed to add event. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error saving event:', error)
      setStatusMessage('Error saving event. Please try again.')
    } finally {
      setIsSubmitting(false)
      
      // Clear success message after 3 seconds
      if (statusMessage.includes('successfully')) {
        setTimeout(() => {
          setStatusMessage('')
        }, 3000)
      }
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setIsSubmitting(true)
      setStatusMessage('Deleting event...')
      
      try {
        const success = await deleteEvent(eventId)
        
        if (success) {
          setEvents(prev => prev.filter(event => event.id !== eventId))
          setStatusMessage('Event deleted successfully!')
          
          // If we're editing this event, reset the form
          if (editingEventId === eventId) {
            setNewEvent({...emptyEvent})
            setEditingEventId(null)
          }
        } else {
          setStatusMessage('Failed to delete event. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        setStatusMessage('Error deleting event. Please try again.')
      } finally {
        setIsSubmitting(false)
        
        // Clear success message after 3 seconds
        if (statusMessage.includes('successfully')) {
          setTimeout(() => {
            setStatusMessage('')
          }, 3000)
        }
      }
    }
  }

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">Events Management</h1>
        <Link 
          href="/admin/dashboard"
          className="bg-gray-800 hover:bg-gray-900 text-yellow-400 px-4 py-2 rounded-md"
        >
          Back to Dashboard
        </Link>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-md mb-4 ${statusMessage.includes('successfully') ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'}`}>
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add/Edit Event Form */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            {editingEventId ? 'Edit Event' : 'Add New Event'}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="eventName" className="block text-yellow-300 mb-1">Event Name*</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={newEvent.eventName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Event Name"
              />
              {formErrors.eventName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.eventName}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-yellow-300 mb-1">Date*</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newEvent.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {formErrors.date && (
                <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="venue" className="block text-yellow-300 mb-1">Venue*</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={newEvent.venue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Venue Name"
              />
              {formErrors.venue && (
                <p className="text-red-500 text-sm mt-1">{formErrors.venue}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-yellow-300 mb-1">Address*</label>
              <input
                type="text"
                id="address"
                name="address"
                value={newEvent.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Venue Address"
              />
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="postcode" className="block text-yellow-300 mb-1">Postcode (Optional - for directions)</label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={newEvent.postcode || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Venue Postcode"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeStart" className="block text-yellow-300 mb-1">Start Time*</label>
                <input
                  type="time"
                  id="timeStart"
                  name="timeStart"
                  value={newEvent.timeStart}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {formErrors.timeStart && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.timeStart}</p>
                )}
              </div>

              <div>
                <label htmlFor="timeEnd" className="block text-yellow-300 mb-1">End Time*</label>
                <input
                  type="time"
                  id="timeEnd"
                  name="timeEnd"
                  value={newEvent.timeEnd}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {formErrors.timeEnd && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.timeEnd}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="ticketLink" className="block text-yellow-300 mb-1">Get Tickets Link</label>
              <input
                type="url"
                id="ticketLink"
                name="ticketLink"
                value={newEvent.ticketLink}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="https://example.com/tickets"
              />
            </div>

            <div className="pt-4 flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? (editingEventId ? 'Updating Event...' : 'Adding Event...') 
                  : (editingEventId ? 'Update Event' : 'Add Event')}
              </button>
              
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Current Events</h2>
          
          {events.length === 0 ? (
            <p className="text-yellow-300">No events added yet. Use the form to add your first event.</p>
          ) :
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 p-4 rounded-md border border-gray-700">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-bold text-yellow-400">{event.eventName}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLoadEventForEdit(event.id)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit event"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete event"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-yellow-300">
                    <strong>Date:</strong> {formatDisplayDate(event.date)}
                  </p>
                  <p className="text-yellow-300">
                    <strong>Venue:</strong> {event.venue}
                  </p>
                  <p className="text-yellow-300">
                    <strong>Address:</strong> {event.address}
                  </p>
                  {event.postcode && (
                    <p className="text-yellow-300">
                      <strong>Postcode:</strong> {event.postcode}
                    </p>
                  )}
                  <p className="text-yellow-300">
                    <strong>Time:</strong> {formatDisplayTime(event.timeStart)} - {formatDisplayTime(event.timeEnd)}
                  </p>
                  {event.ticketLink && (
                    <p className="text-yellow-300">
                      <strong>Tickets:</strong> <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Get Tickets</a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  )
} 