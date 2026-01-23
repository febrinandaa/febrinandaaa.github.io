
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Configuration
export const AUTH_CONFIG = {
    ALLOWED_EMAILS: [
        'febrinanda.co1@gmail.com',
        'febrinanda.co2@gmail.com'
    ],
    // In a real app, use environment variables for passwords!
    // But per user request, we are using this specific password.
    PASSWORD: 'jakarta0101',
    COOKIE_NAME: 'fb_poster_auth_token',
    JWT_SECRET: new TextEncoder().encode(process.env.CRON_SECRET || 'fallback-secret-key-change-me')
};

export async function signToken(payload: { email: string }) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(AUTH_CONFIG.JWT_SECRET);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, AUTH_CONFIG.JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value;

    if (!token) return null;
    return await verifyToken(token);
}

export async function login(email: string) {
    // Verify email is allowed
    if (!AUTH_CONFIG.ALLOWED_EMAILS.includes(email)) {
        return false;
    }

    // Create session
    const token = await signToken({ email });
    const cookieStore = await cookies();

    // Set cookie
    cookieStore.set(AUTH_CONFIG.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
    });

    return true;
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_CONFIG.COOKIE_NAME);
}
