import { NextRequest, NextResponse } from 'next/server';
import { downloadFromDrive } from '@/lib/drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('id');

    if (!fileId) {
        return new NextResponse('Missing fileId', { status: 400 });
    }

    try {
        const buffer = await downloadFromDrive(fileId);

        // Determine content type (naive)
        // In a real app, we should store mimeType in DB or fetch metadata from Drive
        const headers = new Headers();
        headers.set('Content-Type', 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
