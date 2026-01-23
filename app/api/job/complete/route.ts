import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firestore';
import { nowWIB } from '@/lib/dayjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { job_id, success, result, completed_at } = body;

        const dbInstance = db;

        // Create log entry
        await dbInstance.collection(COLLECTIONS.LOGS).add({
            job_id,
            success,
            page_id: result?.page_id,
            post_id: result?.post_id,
            error_type: result?.error_type || null,
            error_message: result?.error_message || null,
            completed_at: completed_at || nowWIB().toISOString(),
            created_at: nowWIB().toISOString()
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Job complete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
