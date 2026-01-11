import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { enabled } = await request.json();
        const db = getDb();

        await db
            .collection(COLLECTIONS.SETTINGS)
            .doc('system')
            .set({ enabled }, { merge: true });

        return NextResponse.json({ success: true, enabled });
    } catch (error) {
        console.error('Toggle error:', error);
        return NextResponse.json(
            { error: 'Failed to toggle system' },
            { status: 500 }
        );
    }
}
