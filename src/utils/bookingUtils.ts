import supabaseAdmin from './supabaseAdmin';

// Interface for booking request data
export interface BookingRequest {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  venue: string;
  event_date: string; // ISO format: 'YYYY-MM-DD'
  event_time?: string;
  event_type?: string;
  additional_info?: string;
  status?: 'new' | 'contacted' | 'booked' | 'declined' | 'canceled';
  created_at?: string;
  updated_at?: string;
}

/**
 * Creates a new booking request in the Supabase database
 * @param bookingData - The booking request data
 * @returns Promise with success status and data or error
 */
export async function createBookingRequest(bookingData: Omit<BookingRequest, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  try {
    // Format date if not already in ISO format
    let formattedData = {
      ...bookingData,
      status: 'new' as const,
    };

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('booking_requests')
      .insert([formattedData])
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      data: data?.[0] || null,
    };
  } catch (error) {
    console.error('Error creating booking request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets all booking requests, with optional filters
 * @param filters - Optional filters for status, date range
 * @returns Promise with success status and data or error
 */
export async function getBookingRequests(filters?: {
  status?: BookingRequest['status'] | BookingRequest['status'][];
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('booking_requests')
      .select('*');
    
    // Apply filters if provided
    if (filters) {
      // Filter by status
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }
      
      // Filter by date range
      if (filters.fromDate) {
        query = query.gte('event_date', filters.fromDate);
      }
      
      if (filters.toDate) {
        query = query.lte('event_date', filters.toDate);
      }
      
      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
    }
    
    // Order by event date, most recent first
    query = query.order('event_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Updates a booking request status
 * @param id - The booking request ID
 * @param status - The new status
 * @returns Promise with success status and data or error
 */
export async function updateBookingStatus(
  id: string, 
  status: BookingRequest['status']
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('booking_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      data: data?.[0] || null,
    };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Deletes a booking request
 * @param id - The booking request ID
 * @returns Promise with success status
 */
export async function deleteBookingRequest(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('booking_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 