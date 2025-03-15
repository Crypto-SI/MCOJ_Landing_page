import { NextRequest, NextResponse } from 'next/server';
import { deleteEvent, updateEvent } from '@/utils/eventsServerUtils';

// DELETE /api/events/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`DELETE request for event with ID: ${params.id}`);
  
  try {
    const eventId = params.id;
    const success = deleteEvent(eventId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`PUT request to update event with ID: ${params.id}`);
  
  try {
    const eventId = params.id;
    const body = await request.json();
    const { event } = body;
    
    const updatedEvent = updateEvent(eventId, event);
    
    if (!updatedEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Error handling PUT request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
} 