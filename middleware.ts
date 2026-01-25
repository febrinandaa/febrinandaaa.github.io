
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AUTH_CONFIG } from '@/lib/auth';

// Paths that do not require authentication
const PUBLIC_PATHS = [
    '/login',
    '/privacy',         // Public for Facebook App Review
    '/terms',           // Public for Facebook App Review
    '/api/auth/login',
    '/api/auth/logout',
    '/api/cron',        // Protected by CRON_SECRET
    '/api/debug',       // Debug endpoint
    '/api/content',     // Content management APIs
    '/api/settings',    // Settings APIs
    '/api/image',       // Image proxy API
];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Allow public paths
    if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
    }

    // 2. Allow static files
    if (path.match(/\.(.*)$/)) {
        return NextResponse.next();
    }

    // 3. Check for auth token
    const token = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;
    const isValid = token ? await verifyToken(token) : false;

    // 4. Redirect to login if not authenticated
    if (!isValid) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
