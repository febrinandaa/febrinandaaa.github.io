import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const pageId = formData.get('pageId') as string;
        const files = formData.getAll('files') as File[];
        const captions = formData.getAll('captions') as string[];

        if (!pageId || files.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const caption = captions[i] || '';

            // Convert file to buffer for Cloudinary
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to Cloudinary
            const timestamp = Date.now();
            const fileName = `${pageId}_${timestamp}_${i}.jpg`;
            const folder = `fb-auto-poster/${pageId}`;

            const cloudinaryResult = await uploadToCloudinary(buffer, fileName, folder);

            // Save to Supabase
            const { data, error } = await supabase
                .from(TABLES.CONTENT)
                .insert({
                    page_id: pageId,
                    file_name: fileName,
                    cloudinary_url: cloudinaryResult.secureUrl,
                    cloudinary_public_id: cloudinaryResult.publicId,
                    base_caption: caption,
                    used_count: 0
                })
                .select()
                .single();

            if (error) throw error;

            results.push({
                id: data.id,
                file_name: data.file_name,
                cloudinary_url: data.cloudinary_url
            });
        }

        return NextResponse.json({
            success: true,
            saved: results.length,
            items: results
        });

    } catch (error: any) {
        console.error('Save error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to save content'
        }, { status: 500 });
    }
}
