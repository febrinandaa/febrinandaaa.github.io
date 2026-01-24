import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Test posting text-only to Facebook feed
export async function POST(request: NextRequest) {
    try {
        const { pageId, message } = await request.json();

        if (!pageId || !message) {
            return NextResponse.json({
                error: 'pageId and message required'
            }, { status: 400 });
        }

        // Get page config
        const { data: pageConfig } = await supabase
            .from(TABLES.PAGES)
            .select('*')
            .eq('id', pageId)
            .single();

        if (!pageConfig?.access_token || !pageConfig?.fb_page_id) {
            return NextResponse.json({
                error: 'Page not found or no token',
                pageId
            }, { status: 404 });
        }

        // Post text-only to feed
        const formData = new FormData();
        formData.append('message', message);
        formData.append('access_token', pageConfig.access_token);

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${pageConfig.fb_page_id}/feed`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const result = await response.json();

        return NextResponse.json({
            success: !result.error,
            pageId,
            fbPageId: pageConfig.fb_page_id,
            postId: result.id || null,
            error: result.error || null,
            rawResponse: result
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
