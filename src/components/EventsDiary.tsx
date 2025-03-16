'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarIcon, MapPinIcon, TicketIcon, ClockIcon } from '@heroicons/react/24/outline';

// Define types
type EventStatus = 'upcoming' | 'past' | 'canceled';

// Define our Event type to match the one used in the admin section
type Event = {
  id: string;
  eventName: string;
  date: string;
  venue: string;
  address: string;
  postcode?: string; // Add optional postcode
  timeStart: string;
  timeEnd: string;
  ticketLink?: string;
  position: number;
  // We'll derive the status based on date
};

export default function EventsDiary() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper to determine if an event is in the past
  const isPastEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    return eventDate < today;
  };
  
  // Filter events based on selected filter
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return !isPastEvent(event.date);
    if (filter === 'past') return isPastEvent(event.date);
    return true;
  });

  // Sort events by date (upcoming first, then past)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // First sort by past/upcoming status
    const aIsPast = isPastEvent(a.date);
    const bIsPast = isPastEvent(b.date);
    
    if (aIsPast && !bIsPast) return 1; // a is past, b is upcoming, so b comes first
    if (!aIsPast && bIsPast) return -1; // a is upcoming, b is past, so a comes first
    
    // Then sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <section id="events" className="relative py-20">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/images/Face the fans.jpg"
          alt="MC OJ facing the fans"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/90 via-brand-navy/85 to-brand-black/90 z-10" />
      
      <div className="container relative z-20 mx-auto px-4">
        <h2 className="section-title text-center">Event Diary</h2>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-12 max-w-3xl mx-auto text-center">
          Catch MC OJ live at these upcoming events or book him for your own show
        </p>
        
        {/* Filter Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-md shadow-sm bg-brand-black/40 p-1">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'upcoming' 
                  ? 'bg-brand-gold text-brand-black font-bold' 
                  : 'text-white hover:bg-brand-grey/30'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'past' 
                  ? 'bg-brand-gold text-brand-black font-bold' 
                  : 'text-white hover:bg-brand-grey/30'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-brand-gold text-brand-black font-bold' 
                  : 'text-white hover:bg-brand-grey/30'
              }`}
            >
              All
            </button>
          </div>
        </div>
        
        {/* Events List */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-brand-grey text-lg">Loading events...</p>
            </div>
          ) : sortedEvents.length > 0 ? (
            sortedEvents.map((event) => {
              const isEventPast = isPastEvent(event.date);
              
              return (
                <div 
                  key={event.id} 
                  className={`bg-brand-black/80 backdrop-blur-sm border-l-4 ${
                    !isEventPast ? 'border-brand-gold' : 'border-brand-grey'
                  } rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Date Column */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-brand-navy/70 rounded-lg p-4 w-24 h-24 border border-brand-grey">
                      <span className="text-brand-gold text-2xl font-bold">
                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric' })}
                      </span>
                      <span className="text-white text-sm uppercase">
                        {new Date(event.date).toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-white text-sm">
                        {new Date(event.date).getFullYear()}
                      </span>
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bank-gothic text-brand-gold mb-2">{event.eventName}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-white">
                          <ClockIcon className="h-4 w-4 mr-2 text-brand-gold" />
                          <span>{event.timeStart} - {event.timeEnd}</span>
                        </div>
                        <div className="flex items-center text-white">
                          <MapPinIcon className="h-4 w-4 mr-2 text-brand-gold" />
                          <span>{event.venue}, {event.address}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      {!isEventPast && event.ticketLink ? (
                        <Link
                          href={event.ticketLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex items-center"
                        >
                          <TicketIcon className="h-4 w-4 mr-2" />
                          Get Tickets
                        </Link>
                      ) : isEventPast ? (
                        <span className="text-brand-grey text-sm px-4 py-2 border border-brand-grey rounded-lg">
                          Past Event
                        </span>
                      ) : (
                        <span className="text-brand-grey text-sm px-4 py-2 border border-brand-grey rounded-lg">
                          Coming Soon
                        </span>
                      )}
                      
                      {/* Get Directions Link */}
                      {event.postcode && (
                        <Link
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.address}, ${event.postcode}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center text-sm"
                        >
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          Get Directions
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-brand-black/50 backdrop-blur-sm rounded-lg">
              <p className="text-brand-grey text-lg">No events found matching your filter.</p>
            </div>
          )}
        </div>
        
        {/* Availability Notice */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-bank-gothic text-brand-gold mb-4">Book MC OJ for Your Event</h3>
          <p className="text-white mb-6">
            MC OJ is available for bookings at a flat rate of <span className="text-brand-gold font-bold">£100 per appearance</span>.
          </p>
          <Link href="#booking" className="btn-secondary inline-flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Check Availability & Book
          </Link>
        </div>
      </div>
    </section>
  );
} 