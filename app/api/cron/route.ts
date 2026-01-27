import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, isSystemEnabled } from '@/lib/supabase';
import { nowWIB } from '@/lib/dayjs';
import { FANPAGES } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Generate idempotency key - using 13 minute intervals for 2-hour per FP schedule
function getExecutionKey(): string {
    const now = nowWIB();
    // Round to nearest 13-minute slot
    const roundedMinute = Math.floor(now.minute() / 13) * 13;
    return now.format('YYYYMMDD-HH') + `-${String(roundedMinute).padStart(2, '0')}`;
}

// Calculate which page should post - 2 hour interval per fanpage
// With 9 fanpages and 13-min cron interval, each FP posts every ~117 min (~2 hours)
function getScheduledPage(): { pageId: string; slotIndex: number } | null {
    const now = nowWIB();
    const hour = now.hour();
    const minute = now.minute();

    // Operating hours: 05:00 - 22:00 WIB
    if (hour < 5 || hour >= 22) return null;

    // Calculate total minutes since 05:00
    const minutesSinceStart = (hour - 5) * 60 + minute;

    // Each slot is 13 minutes, rotate through all fanpages
    const slotIndex = Math.floor(minutesSinceStart / 13) % FANPAGES.length;
    const page = FANPAGES[slotIndex];

    return { pageId: page.id, slotIndex };
}

// Post to Facebook - 2-step method to ensure post appears in Feed
async function postToFacebook(
    pageId: string,
    accessToken: string,
    imageData: Buffer,
    caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
        // Step 1: Upload photo as UNPUBLISHED to get photo_id
        const uploadFormData = new FormData();
        uploadFormData.append('source', new Blob([new Uint8Array(imageData)], { type: 'image/jpeg' }), 'image.jpg');
        uploadFormData.append('published', 'false');
        uploadFormData.append('access_token', accessToken);

        const uploadResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
            method: 'POST',
            body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.error) {
            return { success: false, error: `Upload failed: ${uploadResult.error.message}` };
        }

        const mediaId = uploadResult.id;

        // Step 2: Create feed post with attached_media
        // Use application/json format for proper attached_media handling
        const feedPayload = {
            message: caption,
            attached_media: [{ media_fbid: mediaId }],
            access_token: accessToken
        };

        const feedResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedPayload),
        });

        const feedResult = await feedResponse.json();

        if (feedResult.error) {
            return { success: false, error: `Feed post failed: ${feedResult.error.message}` };
        }

        // Response: { id: "page_id_post_id" }
        return { success: true, postId: feedResult.id };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function GET() {
    return NextResponse.json({
        endpoint: '/api/cron',
        method: 'POST required',
        message: 'Use POST method with Authorization header to trigger cron'
    });
}

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

        // 2. Check system enabled
        const enabled = await isSystemEnabled();
        if (!enabled) {
            return NextResponse.json({
                executed: false,
                reason: 'system_disabled'
            });
        }

        // 3. Get scheduled page
        const schedule = getScheduledPage();
        if (!schedule) {
            return NextResponse.json({
                executed: false,
                reason: 'outside_hours',
                message: 'Operating hours: 05:00-22:00 WIB'
            });
        }

        const { pageId } = schedule;

        // 4. Check idempotency
        const { data: existingRun } = await supabase
            .from(TABLES.CRON_RUNS)
            .select('*')
            .eq('execution_key', executionKey)
            .single();

        if (existingRun) {
            return NextResponse.json({
                executed: false,
                reason: 'already_executed',
                execution_key: executionKey
            });
        }

        // 5. Create cron run record
        await supabase.from(TABLES.CRON_RUNS).insert({
            execution_key: executionKey,
            page_id: pageId,
            status: 'running'
        });

        // 6. Get unused content
        const { data: content } = await supabase
            .from(TABLES.CONTENT)
            .select('*')
            .eq('page_id', pageId)
            .eq('used_count', 0)
            .limit(1)
            .single();

        if (!content) {
            await supabase.from(TABLES.CRON_RUNS)
                .update({ status: 'no_content' })
                .eq('execution_key', executionKey);

            return NextResponse.json({
                executed: false,
                reason: 'no_content',
                message: `No content available for ${pageId}`
            });
        }

        // 7. Get page config (access token)
        const { data: pageConfig } = await supabase
            .from(TABLES.PAGES)
            .select('*')
            .eq('id', pageId)
            .single();

        if (!pageConfig?.access_token) {
            await supabase.from(TABLES.CRON_RUNS)
                .update({ status: 'no_token' })
                .eq('execution_key', executionKey);

            return NextResponse.json({
                executed: false,
                reason: 'no_token',
                message: `No access token for ${pageId}`
            });
        }

        // 8. Download image from Cloudinary
        let imageData: Buffer;
        try {
            if (!content.cloudinary_url) {
                throw new Error('No cloudinary_url');
            }
            const response = await fetch(content.cloudinary_url);
            const arrayBuffer = await response.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
        } catch (error) {
            await supabase.from(TABLES.CRON_RUNS)
                .update({ status: 'image_error' })
                .eq('execution_key', executionKey);

            return NextResponse.json({
                executed: true,
                success: false,
                error: 'Failed to fetch image'
            });
        }

        // 9. Post to Facebook
        const fbResult = await postToFacebook(
            pageConfig.fb_page_id,
            pageConfig.access_token,
            imageData,
            content.base_caption
        );

        // 10. Update content used count
        await supabase
            .from(TABLES.CONTENT)
            .update({
                used_count: (content.used_count || 0) + 1,
                last_used_at: new Date().toISOString()
            })
            .eq('id', content.id);

        // 11. Log posting
        await supabase.from(TABLES.POSTING_LOGS).insert({
            page_id: pageId,
            content_id: content.id,
            success: fbResult.success,
            post_id: fbResult.postId || null,
            error_message: fbResult.error || null,
            source: 'fresh'
        });

        // 12. Update cron run
        const duration = Date.now() - startTime;
        await supabase.from(TABLES.CRON_RUNS)
            .update({ status: fbResult.success ? 'success' : 'fb_error' })
            .eq('execution_key', executionKey);

        return NextResponse.json({
            executed: true,
            success: fbResult.success,
            page_id: pageId,
            post_id: fbResult.postId,
            error: fbResult.error,
            duration_ms: duration
        });

    } catch (error: any) {
        console.error('Cron error:', error);
        return NextResponse.json({
            executed: false,
            error: error.message
        }, { status: 500 });
    }
}
