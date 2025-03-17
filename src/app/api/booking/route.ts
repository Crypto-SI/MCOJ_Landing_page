import { NextRequest, NextResponse } from 'next/server';
import { createBookingRequest } from '@/utils/bookingUtils';

/**
 * API Route to handle booking form submissions
 * POST /api/booking
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request data
    const data = await request.json();
    const { name, email, phone, venue, date, time, eventType, message } = data;

    // Validate required fields
    if (!name || !email || !venue || !date) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Format data for Supabase
    const bookingData = {
      name,
      email,
      phone: phone || null,
      venue,
      event_date: date, // Expecting date in ISO format
      event_time: time || null,
      event_type: eventType || null,
      additional_info: message || null,
    };

    // Save to Supabase
    const result = await createBookingRequest(bookingData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Booking request received! We will be in touch soon.',
        bookingId: result.data?.id,
      });
    } else {
      console.error('Error saving booking request:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to process your booking request. Please try again later.' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Booking request error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
} 