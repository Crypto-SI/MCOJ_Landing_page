import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getBookingRequests, 
  updateBookingStatus, 
  deleteBookingRequest,
  BookingRequest
} from '@/utils/bookingUtils';

/**
 * Check if the request is authenticated
 */
function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('mcoj_admin_authenticated');
  return !!authCookie && authCookie.value === 'true';
}

/**
 * GET /api/admin/bookings
 * Get all booking requests with optional filtering
 */
export async function GET(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: {
      status?: BookingRequest['status'] | BookingRequest['status'][];
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    } = {};
    
    // Extract status filter (can be multiple)
    const statusParam = searchParams.getAll('status');
    if (statusParam.length > 0) {
      if (statusParam.length === 1) {
        filters.status = statusParam[0] as BookingRequest['status'];
      } else {
        filters.status = statusParam as BookingRequest['status'][];
      }
    }
    
    // Extract date range filters
    const fromDate = searchParams.get('fromDate');
    if (fromDate) filters.fromDate = fromDate;
    
    const toDate = searchParams.get('toDate');
    if (toDate) filters.toDate = toDate;
    
    // Extract pagination
    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);
    
    const offset = searchParams.get('offset');
    if (offset) filters.offset = parseInt(offset, 10);

    // Fetch booking requests
    const result = await getBookingRequests(filters);
    
    if (result.success) {
      return NextResponse.json({ success: true, bookings: result.data });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to fetch booking requests' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings
 * Update a booking request status
 */
export async function PATCH(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    const { id, status } = data;
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: id and status' },
        { status: 400 }
      );
    }
    
    // Validate status value
    const validStatuses = ['new', 'contacted', 'booked', 'declined', 'canceled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Update booking status
    const result = await updateBookingStatus(id, status as BookingRequest['status']);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Booking status updated successfully',
        booking: result.data 
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to update booking status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings
 * Delete a booking request
 */
export async function DELETE(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Delete the booking request
    const result = await deleteBookingRequest(id);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Booking request deleted successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to delete booking request' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting booking request:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 