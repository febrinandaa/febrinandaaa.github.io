import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, MULTI_PHOTO_CONFIG } from '@/lib/supabase';
import { FANPAGES } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Longer timeout for multi-photo

// Post multi-photo to Facebook
async function postMultiPhotoToFacebook(
    fbPageId: string,
    accessToken: string,
    images: { url: string; caption: string }[],
    mainCaption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
        const photoIds: string[] = [];

        // Step 1: Upload each photo as UNPUBLISHED with individual caption
        for (let i = 0; i < images.length; i++) {
            const { url, caption } = images[i];

            const uploadFormData = new URLSearchParams();
            uploadFormData.append('url', url);
            uploadFormData.append('published', 'false');
            uploadFormData.append('caption', caption); // Individual caption!
            uploadFormData.append('access_token', accessToken);

            const uploadResponse = await fetch(
                `https://graph.facebook.com/v19.0/${fbPageId}/photos`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: uploadFormData.toString(),
                }
            );

            const uploadResult = await uploadResponse.json();

            if (uploadResult.error) {
                console.error(`Photo ${i} upload failed:`, uploadResult.error);
                continue;
            }

            photoIds.push(uploadResult.id);
        }

        if (photoIds.length < 2) {
            return { success: false, error: 'Failed to upload enough photos (min 2)' };
        }

        // Step 2: Create feed post with attached_media array
        const attachedMedia = photoIds.map(id => ({ media_fbid: id }));

        const feedPayload = {
            message: mainCaption,
            attached_media: attachedMedia,
            access_token: accessToken
        };

        const feedResponse = await fetch(
            `https://graph.facebook.com/v19.0/${fbPageId}/feed`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedPayload),
            }
        );

        const feedResult = await feedResponse.json();

        if (feedResult.error) {
            return { success: false, error: `Feed post failed: ${feedResult.error.message}` };
        }

        return { success: true, postId: feedResult.id };

    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// POST - Test multi-photo posting
export async function POST(request: NextRequest) {
    try {
        const { group_id } = await request.json();

        if (!group_id) {
            return NextResponse.json({ error: 'group_id required' }, { status: 400 });
        }

        // 1. Get content group
        const { data: group, error: groupError } = await supabase
            .from(TABLES.CONTENT_GROUPS)
            .select('*')
            .eq('id', group_id)
            .single();

        if (groupError || !group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // 2. Get all content in group
        const { data: contents, error: contentsError } = await supabase
            .from(TABLES.CONTENT)
            .select('*')
            .eq('group_id', group_id)
            .order('sort_order', { ascending: true });

        if (contentsError || !contents || contents.length < 2) {
            return NextResponse.json({
                error: 'Need at least 2 images in group'
            }, { status: 400 });
        }

        // 3. Get page access token
        const { data: pageConfig } = await supabase
            .from(TABLES.PAGES)
            .select('*')
            .eq('id', group.page_id)
            .single();

        if (!pageConfig?.access_token) {
            return NextResponse.json({
                error: `No access token for ${group.page_id}`
            }, { status: 400 });
        }

        // Get FB page ID from config
        const fanpage = FANPAGES.find(fp => fp.id === group.page_id);
        if (!fanpage?.fbPageId) {
            return NextResponse.json({
                error: `FB Page ID not found for ${group.page_id}`
            }, { status: 400 });
        }

        // 4. Prepare images with captions
        const images = contents.map(c => ({
            url: c.cloudinary_url,
            caption: c.individual_caption || c.base_caption || ''
        }));

        // 5. Post to Facebook
        const result = await postMultiPhotoToFacebook(
            fanpage.fbPageId,
            pageConfig.access_token,
            images,
            group.main_caption || group.title
        );

        // 6. Update group status if successful
        if (result.success) {
            await supabase
                .from(TABLES.CONTENT_GROUPS)
                .update({
                    status: 'used',
                    used_at: new Date().toISOString()
                })
                .eq('id', group_id);

            // Update content used count
            for (const content of contents) {
                await supabase
                    .from(TABLES.CONTENT)
                    .update({
                        used_count: (content.used_count || 0) + 1,
                        last_used_at: new Date().toISOString()
                    })
                    .eq('id', content.id);
            }

            // Log posting
            await supabase.from(TABLES.POSTING_LOGS).insert({
                page_id: group.page_id,
                content_id: contents[0].id, // Log first content as reference
                success: true,
                post_id: result.postId,
                source: 'multi_photo'
            });
        }

        return NextResponse.json({
            success: result.success,
            post_id: result.postId,
            error: result.error,
            images_posted: images.length
        });

    } catch (error: any) {
        console.error('Multi-photo post error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
