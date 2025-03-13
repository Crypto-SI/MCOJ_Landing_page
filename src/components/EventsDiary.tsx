'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, TicketIcon, ClockIcon } from '@heroicons/react/24/outline';

// Define types
type EventStatus = 'upcoming' | 'past' | 'canceled';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  ticketLink?: string;
  description: string;
  status: EventStatus;
};

// Sample events data
const eventsData: Event[] = [
  {
    id: '1',
    title: 'UK Garage Classics',
    date: '2023-06-15',
    time: '22:00 - 03:00',
    venue: 'Club Empire',
    location: 'London, UK',
    ticketLink: 'https://tickets.example.com/ukgarage',
    description: 'A night of classic UK Garage hits featuring MC OJ on the mic alongside top DJs.',
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'Summer Vibes Festival',
    date: '2023-07-22',
    time: '14:00 - 22:00',
    venue: 'Victoria Park',
    location: 'London, UK',
    ticketLink: 'https://tickets.example.com/summerfest',
    description: 'The biggest summer festival with multiple stages and MC OJ hosting the Garage tent.',
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'Throwback Thursday',
    date: '2023-08-10',
    time: '21:00 - 02:00',
    venue: 'Rhythm Lounge',
    location: 'Manchester, UK',
    ticketLink: 'https://tickets.example.com/throwback',
    description: 'A journey through the golden era of UK Garage with MC OJ at the helm.',
    status: 'upcoming',
  },
  {
    id: '4',
    title: 'Bank Holiday Special',
    date: '2023-08-28',
    time: '16:00 - 02:00',
    venue: 'Sky Garden',
    location: 'Birmingham, UK',
    ticketLink: 'https://tickets.example.com/bankholiday',
    description: 'Bank holiday garage party with a lineup of legendary MCs and DJs.',
    status: 'upcoming',
  },
  {
    id: '5',
    title: 'Urban Beats',
    date: '2023-05-12',
    time: '22:00 - 04:00',
    venue: 'The Warehouse',
    location: 'Bristol, UK',
    description: 'MC OJ brings the energy to Bristol\'s premier underground venue.',
    status: 'past',
  },
];

export default function EventsDiary() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  
  // Filter events based on selected filter
  const filteredEvents = eventsData.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.status === 'upcoming';
    if (filter === 'past') return event.status === 'past';
    return true;
  });

  return (
    <section id="events" className="py-20 bg-brand-navy">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Event Diary</h2>
        <p className="section-subtitle text-center max-w-3xl mx-auto">
          Catch MC OJ live at these upcoming events or book him for your own show
        </p>
        
        {/* Filter Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-md shadow-sm bg-brand-grey/20 p-1">
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
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className={`bg-brand-black border-l-4 ${
                  event.status === 'upcoming' ? 'border-brand-gold' : 'border-brand-grey'
                } rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Date Column */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-brand-navy rounded-lg p-4 w-24 h-24 border border-brand-grey">
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
                    <h3 className="text-xl font-bank-gothic text-brand-gold mb-2">{event.title}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-white">
                        <ClockIcon className="h-4 w-4 mr-2 text-brand-gold" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-white">
                        <MapPinIcon className="h-4 w-4 mr-2 text-brand-gold" />
                        <span>{event.venue}, {event.location}</span>
                      </div>
                      <p className="text-brand-grey text-sm mt-2">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {event.status === 'upcoming' && event.ticketLink ? (
                      <Link
                        href={event.ticketLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center"
                      >
                        <TicketIcon className="h-4 w-4 mr-2" />
                        Get Tickets
                      </Link>
                    ) : event.status === 'past' ? (
                      <span className="text-brand-grey text-sm px-4 py-2 border border-brand-grey rounded-lg">
                        Past Event
                      </span>
                    ) : (
                      <span className="text-brand-grey text-sm px-4 py-2 border border-brand-grey rounded-lg">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
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