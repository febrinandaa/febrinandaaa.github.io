import { NextResponse } from 'next/server';
import { isSystemEnabled } from '@/lib/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const enabled = await isSystemEnabled();
        return NextResponse.json({ enabled });
    } catch (error) {
        console.error('Status check error:', error);
        // Default to enabled if Firestore is not configured
        return NextResponse.json({ enabled: true });
    }
}
