import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Verifies if a request is from an authenticated admin user
 * @param request - The Next.js request object
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    // Check from cookies first (for server components / API routes)
    const cookieStore = cookies();
    const authCookie = cookieStore.get('mcoj_admin_authenticated');
    
    if (authCookie && authCookie.value === 'true') {
      return true;
    }

    // Fallback to checking Authorization header for programmatic API calls
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In a real app, you would validate the token with a proper JWT validation
      // For this simple example, we'll check if it matches a secret token
      return token === process.env.ADMIN_API_KEY;
    }

    return false;
  } catch (error) {
    console.error('Error verifying admin authentication:', error);
    return false;
  }
} 