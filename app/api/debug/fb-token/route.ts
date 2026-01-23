import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firestore';

export const dynamic = 'force-dynamic';

// Debug endpoint to check Facebook token and test posting
export async function GET(request: NextRequest) {
    const pageId = request.nextUrl.searchParams.get('pageId') || 'FP_1';

    try {
        // Get page config from Firestore
        const pageDoc = await db.collection(COLLECTIONS.PAGES).doc(pageId).get();

        if (!pageDoc.exists) {
            return NextResponse.json({
                error: 'Page config not found',
                pageId,
                hint: 'Need to add page token via settings'
            }, { status: 404 });
        }

        const pageData = pageDoc.data()!;
        const fbPageId = pageData.fb_page_id;
        const accessToken = pageData.access_token;

        // Mask token for display
        const maskedToken = accessToken
            ? `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 5)}`
            : 'NOT_SET';

        // Test token by calling Facebook API
        let tokenStatus = 'unknown';
        let permissions: string[] = [];
        let fbError = null;

        if (accessToken) {
            try {
                // Debug token
                const debugRes = await fetch(
                    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
                );
                const debugData = await debugRes.json();

                if (debugData.data) {
                    tokenStatus = debugData.data.is_valid ? 'valid' : 'invalid';
                    permissions = debugData.data.scopes || [];
                } else if (debugData.error) {
                    tokenStatus = 'error';
                    fbError = debugData.error.message;
                }
            } catch (e: any) {
                tokenStatus = 'fetch_error';
                fbError = e.message;
            }
        } else {
            tokenStatus = 'not_set';
        }

        // Get content count for this page
        const contentQuery = await db.collection(COLLECTIONS.CONTENT)
            .where('page_id', '==', pageId)
            .get();

        const unusedContent = contentQuery.docs.filter(d => !d.data().used_count || d.data().used_count === 0);

        return NextResponse.json({
            pageId,
            fb_page_id: fbPageId || 'NOT_SET',
            token_masked: maskedToken,
            token_status: tokenStatus,
            token_error: fbError,
            permissions,
            content_total: contentQuery.size,
            content_unused: unusedContent.length,
            required_permissions: ['pages_read_engagement', 'pages_manage_posts', 'pages_show_list']
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            pageId
        }, { status: 500 });
    }
}
