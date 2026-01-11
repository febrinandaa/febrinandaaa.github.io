import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS, isSystemEnabled, acquireLock } from '@/lib/firestore';
import { nowWIB } from '@/lib/dayjs';
import { FANPAGES } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Calculate which page should post based on current time
function getScheduledPage(): { pageId: string; slotIndex: number } | null {
    const now = nowWIB();
    const hour = now.hour();
    const minute = now.minute();

    // Operating hours: 05:00 - 22:00 WIB
    if (hour < 5 || hour >= 22) {
        return null;
    }

    // Calculate slot (every 6 minutes)
    const slotIndex = Math.floor(minute / 6) % FANPAGES.length;
    const page = FANPAGES[slotIndex];

    return {
        pageId: page.id,
        slotIndex
    };
}

export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Kill Switch
        const enabled = await isSystemEnabled();
        if (!enabled) {
            return NextResponse.json(
                { status: 'disabled', message: 'System is disabled' },
                { status: 503 }
            );
        }

        // Get scheduled page
        const schedule = getScheduledPage();
        if (!schedule) {
            return new NextResponse(null, { status: 204 }); // No content - outside hours
        }

        const { pageId, slotIndex } = schedule;
        const now = nowWIB();
        const hourKey = now.format('HH');

        // Try to acquire lock
        const lockAcquired = await acquireLock(pageId, hourKey);
        if (!lockAcquired) {
            return NextResponse.json(
                { status: 'locked', message: 'Job already in progress' },
                { status: 409 }
            );
        }

        // Get next content for this page
        const db = getDb();
        const contentQuery = await db
            .collection(COLLECTIONS.CONTENT)
            .where('page_id', '==', pageId)
            .orderBy('used_count', 'asc')
            .orderBy('created_at', 'asc')
            .limit(1)
            .get();

        if (contentQuery.empty) {
            return new NextResponse(null, { status: 204 }); // No content available
        }

        const contentDoc = contentQuery.docs[0];
        const content = contentDoc.data();

        // Get page config (access token would be stored in Firestore pages collection)
        const pageDoc = await db
            .collection(COLLECTIONS.PAGES)
            .doc(pageId)
            .get();

        const pageData = pageDoc.exists ? pageDoc.data() : {};

        // Increment used_count
        await contentDoc.ref.update({
            used_count: (content.used_count || 0) + 1,
            last_used_at: now.toISOString()
        });

        return NextResponse.json({
            status: 'ready',
            job_id: contentDoc.id,
            page_id: pageId,
            fb_page_id: pageData?.fb_page_id || '',
            access_token: pageData?.access_token || '',
            file_id: content.drive_file_id,
            caption: content.base_caption,
            slot_index: slotIndex
        });

    } catch (error) {
        console.error('Job claim error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
