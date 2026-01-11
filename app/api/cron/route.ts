import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS, isSystemEnabled } from '@/lib/firestore';
import { downloadFromDrive } from '@/lib/drive';
import { nowWIB } from '@/lib/dayjs';
import { FANPAGES } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for Vercel

// Generate idempotency key: YYYYMMDD-HH-mm(rounded to 6min)
function getExecutionKey(): string {
    const now = nowWIB();
    const roundedMinute = Math.floor(now.minute() / 6) * 6;
    return now.format('YYYYMMDD-HH') + `-${String(roundedMinute).padStart(2, '0')}`;
}

// Calculate which page should post based on current time
function getScheduledPage(): { pageId: string; slotIndex: number } | null {
    const now = nowWIB();
    const hour = now.hour();
    const minute = now.minute();

    // Operating hours: 05:00 - 22:00 WIB (Defense in Depth)
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

// Post photo to Facebook
async function postToFacebook(
    pageId: string,
    accessToken: string,
    imageData: Buffer,
    caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    const FB_API_URL = 'https://graph.facebook.com/v19.0';

    try {
        const formData = new FormData();
        formData.append('source', new Blob([new Uint8Array(imageData)], { type: 'image/jpeg' }), 'image.jpg');
        formData.append('message', caption);
        formData.append('access_token', accessToken);

        const response = await fetch(`${FB_API_URL}/${pageId}/photos`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.error) {
            return { success: false, error: result.error.message };
        }

        return { success: true, postId: result.post_id || result.id };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// Log cron execution to Firestore
async function logCronExecution(data: {
    execution_key: string;
    executed: boolean;
    reason?: string;
    page_id?: string;
    posts_processed?: number;
    posts_published?: number;
    success?: boolean;
    error_type?: string;
    error_message?: string;
    duration_ms: number;
}) {
    const db = getDb();
    await db.collection('cron_logs').add({
        ...data,
        timestamp: nowWIB().toISOString()
    });
}

// Main cron handler - POST only for security
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const executionKey = getExecutionKey();

    try {
        // 1. Verify CRON_SECRET
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify User-Agent (optional protection)
        const userAgent = request.headers.get('user-agent') || '';
        const allowedAgents = ['cron-job.org', 'curl', 'insomnia', 'postman'];
        const isAllowedAgent = allowedAgents.some(agent =>
            userAgent.toLowerCase().includes(agent.toLowerCase())
        );

        // In production, uncomment to enforce:
        // if (!isAllowedAgent && process.env.NODE_ENV === 'production') {
        //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }

        // 3. Defense in Depth - Time validation
        const schedule = getScheduledPage();
        if (!schedule) {
            const duration = Date.now() - startTime;
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'outside_posting_window',
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'outside_posting_window',
                message: 'Outside operating hours (05:00-22:00 WIB)'
            });
        }

        // 4. Check Kill Switch
        const enabled = await isSystemEnabled();
        if (!enabled) {
            const duration = Date.now() - startTime;
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'disabled',
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'disabled',
                message: 'System is disabled (Kill Switch ON)'
            });
        }

        // 5. Idempotency check - prevent duplicate execution
        const db = getDb();
        const existingRun = await db.collection('cron_runs').doc(executionKey).get();

        if (existingRun.exists) {
            const duration = Date.now() - startTime;
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'already_executed',
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'already_executed',
                message: `Slot ${executionKey} already processed`
            });
        }

        // Mark this slot as executed (idempotency)
        await db.collection('cron_runs').doc(executionKey).set({
            started_at: nowWIB().toISOString(),
            status: 'running'
        });

        const { pageId } = schedule;
        const now = nowWIB();

        // Get next content for this page
        const contentQuery = await db
            .collection(COLLECTIONS.CONTENT)
            .where('page_id', '==', pageId)
            .orderBy('used_count', 'asc')
            .orderBy('created_at', 'asc')
            .limit(1)
            .get();

        if (contentQuery.empty) {
            const duration = Date.now() - startTime;
            await db.collection('cron_runs').doc(executionKey).update({
                status: 'completed',
                result: 'no_content'
            });
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'no_content',
                page_id: pageId,
                posts_processed: 0,
                posts_published: 0,
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'no_content',
                message: `No content available for ${pageId}`
            });
        }

        const contentDoc = contentQuery.docs[0];
        const content = contentDoc.data();

        // Get page config (access token)
        const pageDoc = await db
            .collection(COLLECTIONS.PAGES)
            .doc(pageId)
            .get();

        if (!pageDoc.exists) {
            const duration = Date.now() - startTime;
            await db.collection('cron_runs').doc(executionKey).update({
                status: 'completed',
                result: 'no_page_config'
            });
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'no_page_config',
                page_id: pageId,
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'no_page_config',
                message: `Page config not found for ${pageId}`
            });
        }

        const pageData = pageDoc.data()!;
        const fbPageId = pageData.fb_page_id;
        const accessToken = pageData.access_token;

        if (!accessToken) {
            const duration = Date.now() - startTime;
            await db.collection('cron_runs').doc(executionKey).update({
                status: 'completed',
                result: 'no_token'
            });
            await logCronExecution({
                execution_key: executionKey,
                executed: false,
                reason: 'no_token',
                page_id: pageId,
                duration_ms: duration
            });
            return NextResponse.json({
                executed: false,
                reason: 'no_token',
                message: `No access token for ${pageId}`
            });
        }

        // Download image from Drive
        let imageData: Buffer;
        try {
            imageData = await downloadFromDrive(content.drive_file_id);
        } catch (error) {
            const duration = Date.now() - startTime;
            await db.collection('cron_runs').doc(executionKey).update({
                status: 'error',
                result: 'drive_error'
            });
            await db.collection(COLLECTIONS.LOGS).add({
                page_id: pageId,
                content_id: contentDoc.id,
                success: false,
                error_type: 'ERR_DRIVE',
                error_message: String(error),
                created_at: now.toISOString()
            });
            await logCronExecution({
                execution_key: executionKey,
                executed: true,
                success: false,
                error_type: 'ERR_DRIVE',
                error_message: String(error),
                page_id: pageId,
                posts_processed: 1,
                posts_published: 0,
                duration_ms: duration
            });

            return NextResponse.json({
                executed: true,
                success: false,
                error_type: 'ERR_DRIVE',
                error_message: String(error)
            });
        }

        // Post to Facebook
        const fbResult = await postToFacebook(
            fbPageId,
            accessToken,
            imageData,
            content.base_caption
        );

        // Update content used count
        await contentDoc.ref.update({
            used_count: (content.used_count || 0) + 1,
            last_used_at: now.toISOString()
        });

        const duration = Date.now() - startTime;

        // Update cron_runs
        await db.collection('cron_runs').doc(executionKey).update({
            status: 'completed',
            result: fbResult.success ? 'success' : 'fb_error',
            completed_at: nowWIB().toISOString()
        });

        // Log to posting logs
        await db.collection(COLLECTIONS.LOGS).add({
            page_id: pageId,
            content_id: contentDoc.id,
            success: fbResult.success,
            post_id: fbResult.postId || null,
            error_type: fbResult.success ? null : 'ERR_FB',
            error_message: fbResult.error || null,
            duration_ms: duration,
            created_at: now.toISOString()
        });

        // Log to cron_logs
        await logCronExecution({
            execution_key: executionKey,
            executed: true,
            success: fbResult.success,
            page_id: pageId,
            posts_processed: 1,
            posts_published: fbResult.success ? 1 : 0,
            error_type: fbResult.success ? undefined : 'ERR_FB',
            error_message: fbResult.error,
            duration_ms: duration
        });

        return NextResponse.json({
            executed: true,
            success: fbResult.success,
            page_id: pageId,
            post_id: fbResult.postId,
            error: fbResult.error,
            duration_ms: duration
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('Cron error:', error);

        await logCronExecution({
            execution_key: executionKey,
            executed: true,
            success: false,
            error_type: 'ERR_UNKNOWN',
            error_message: String(error),
            duration_ms: duration
        });

        return NextResponse.json({
            executed: true,
            success: false,
            error_type: 'ERR_UNKNOWN',
            error_message: String(error),
            duration_ms: duration
        }, { status: 500 });
    }
}

// GET method returns info only (no execution)
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/cron',
        method: 'POST required',
        message: 'Use POST method with Authorization header to trigger cron'
    });
}
