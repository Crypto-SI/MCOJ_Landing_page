import { NextRequest, NextResponse } from 'next/server';
import { getEvents, addEvent, getNextPosition } from '@/utils/eventsServerUtils';

// GET /api/events
export async function GET(request: NextRequest) {
  console.log('GET request for events');
  
  try {
    // Get all events
    const events = getEvents();
    
    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  console.log('POST request to add event');
  
  try {
    const body = await request.json();
    const { event } = body;
    
    // Assign the next available position if not provided
    if (!event.position) {
      event.position = getNextPosition();
    }
    
    // Add the event
    const newEvent = addEvent(event);
    
    return NextResponse.json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add event' },
      { status: 500 }
    );
  }
} 