import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firestore';

export const dynamic = 'force-dynamic';

// Debug endpoint to check content data
export async function GET(request: NextRequest) {
    const pageId = request.nextUrl.searchParams.get('pageId') || 'FP_1';

    try {
        // Get one unused content
        const contentQuery = await db.collection(COLLECTIONS.CONTENT)
            .where('page_id', '==', pageId)
            .limit(5)
            .get();

        const contents = contentQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                file_name: data.file_name,
                cloudinary_url: data.cloudinary_url || null,
                cloudinary_public_id: data.cloudinary_public_id || null,
                drive_file_id: data.drive_file_id || null,
                base_caption: data.base_caption ? data.base_caption.substring(0, 100) + '...' : null,
                used_count: data.used_count || 0,
                has_image_source: !!(data.cloudinary_url || data.drive_file_id)
            };
        });

        // Check if cloudinary_url is accessible
        let cloudinaryTest = null;
        if (contents[0]?.cloudinary_url) {
            try {
                const res = await fetch(contents[0].cloudinary_url, { method: 'HEAD' });
                cloudinaryTest = {
                    url: contents[0].cloudinary_url,
                    status: res.status,
                    ok: res.ok,
                    contentType: res.headers.get('content-type')
                };
            } catch (e: any) {
                cloudinaryTest = {
                    url: contents[0].cloudinary_url,
                    error: e.message
                };
            }
        }

        return NextResponse.json({
            pageId,
            content_count: contentQuery.size,
            sample_contents: contents,
            cloudinary_test: cloudinaryTest
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            pageId
        }, { status: 500 });
    }
}
