import { NextRequest, NextResponse } from 'next/server';
import { reorderEvents } from '@/utils/eventsServerUtils';

// POST /api/events/reorder
export async function POST(request: NextRequest) {
  console.log('POST request to reorder events');
  
  try {
    const body = await request.json();
    const { eventIds } = body;
    
    if (!Array.isArray(eventIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid eventIds format' },
        { status: 400 }
      );
    }
    
    const events = reorderEvents(eventIds);
    
    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Error handling reorder request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder events' },
      { status: 500 }
    );
  }
} 