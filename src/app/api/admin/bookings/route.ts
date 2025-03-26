import { NextRequest, NextResponse } from 'next/server';
import { getBookingRequests, updateBookingStatus, deleteBookingRequest } from '@/utils/bookingUtils';
import { verifyAdminAuth } from '@/utils/authUtils';

/**
 * GET handler for fetching booking requests
 * GET /api/admin/bookings
 * 
 * Query parameters:
 * - status: Filter by status (optional)
 * - fromDate: Filter by date range start (optional)
 * - toDate: Filter by date range end (optional)
 * - limit: Number of results to return (optional, default 100)
 * - offset: Offset for pagination (optional, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Convert parameters to proper format
    const filters: any = {};
    
    if (statusParam) {
      filters.status = statusParam;
    }
    
    if (fromDate) {
      filters.fromDate = fromDate;
    }
    
    if (toDate) {
      filters.toDate = toDate;
    }
    
    if (limitParam) {
      filters.limit = parseInt(limitParam, 10);
    }
    
    if (offsetParam) {
      filters.offset = parseInt(offsetParam, 10);
    }

    // Fetch booking requests
    const result = await getBookingRequests(filters);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating booking status
 * PUT /api/admin/bookings
 * 
 * Request body:
 * - id: Booking ID
 * - status: New status value
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, status } = body;

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id and status' },
        { status: 400 }
      );
    }

    // Update booking status
    const result = await updateBookingStatus(id, status);

    if (result.success) {
      return NextResponse.json({
        success: true,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a booking request
 * DELETE /api/admin/bookings
 * 
 * Request body:
 * - id: Booking ID
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Delete booking request
    const result = await deleteBookingRequest(id);

    if (result.success) {
      return NextResponse.json({
        success: true,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting booking request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 