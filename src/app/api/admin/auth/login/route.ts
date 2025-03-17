import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route to handle admin login and set authentication cookie
 * POST /api/admin/auth/login
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { username, token } = data;
    
    // Basic validation - in a real app, you'd validate against a database
    // and use proper authentication/hashing
    if (username === 'admin' && token === 'admin123') {
      // Set the authentication cookie
      const cookieStore = cookies();
      
      // Set cookie with HttpOnly for security
      // In production, you'd want to use secure cookies and proper JWTs
      cookieStore.set('mcoj_admin_authenticated', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
      });
      
      return NextResponse.json({
        success: true,
        message: 'Authentication successful'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 