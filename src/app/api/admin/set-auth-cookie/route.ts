import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route to set admin authentication cookie
 * POST /api/admin/set-auth-cookie
 */
export async function POST(req: NextRequest) {
  try {
    // Extract data from request to check authentication
    // We rely on the client telling us they're authenticated
    // This is just to sync the cookie with localStorage
    
    // Set the authentication cookie
    const cookieStore = cookies();
    
    // Set a cookie that expires in 7 days
    cookieStore.set('mcoj_admin_authenticated', 'true', {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return NextResponse.json({ success: true, message: 'Auth cookie set successfully' });
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set auth cookie', error: String(error) },
      { status: 500 }
    );
  }
} 