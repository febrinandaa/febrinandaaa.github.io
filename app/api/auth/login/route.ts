
import { NextRequest, NextResponse } from 'next/server';
import { login, AUTH_CONFIG } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. Verify Password
        if (password !== AUTH_CONFIG.PASSWORD) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            );
        }

        // 2. Verify Email & Create Session
        const success = await login(email);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Email not authorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
