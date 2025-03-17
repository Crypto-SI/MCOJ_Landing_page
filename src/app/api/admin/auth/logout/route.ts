import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route to handle admin logout and clear authentication cookie
 * POST /api/admin/auth/logout
 */
export async function POST(req: NextRequest) {
  try {
    // Clear the authentication cookie
    const cookieStore = cookies();
    cookieStore.delete('mcoj_admin_authenticated');
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 