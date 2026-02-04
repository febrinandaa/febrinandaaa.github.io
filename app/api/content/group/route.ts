import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, MULTI_PHOTO_CONFIG } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// POST - Create a new content group with multiple images
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const pageId = formData.get('page_id') as string;
        const title = formData.get('title') as string;
        const mainCaption = formData.get('main_caption') as string;

        // Validate pageId is enabled for multi-photo
        if (!MULTI_PHOTO_CONFIG.ENABLED_PAGES.includes(pageId)) {
            return NextResponse.json({
                error: `Multi-photo tidak tersedia untuk page ${pageId}`
            }, { status: 400 });
        }

        // Get all images and their individual captions
        const images: { file: File; caption: string }[] = [];

        for (let i = 0; i < MULTI_PHOTO_CONFIG.MAX_IMAGES; i++) {
            const file = formData.get(`image_${i}`) as File | null;
            const caption = formData.get(`caption_${i}`) as string || '';

            if (file && file.size > 0) {
                images.push({ file, caption });
            }
        }

        if (images.length < 2) {
            return NextResponse.json({
                error: 'Minimal 2 gambar diperlukan untuk multi-photo post'
            }, { status: 400 });
        }

        // 1. Create content group
        const { data: group, error: groupError } = await supabase
            .from(TABLES.CONTENT_GROUPS)
            .insert({
                page_id: pageId,
                title: title,
                main_caption: mainCaption,
                status: 'pending'
            })
            .select()
            .single();

        if (groupError) {
            throw new Error(`Failed to create group: ${groupError.message}`);
        }

        // 2. Upload each image and create content records
        const uploadedContents = [];

        for (let i = 0; i < images.length; i++) {
            const { file, caption } = images[i];

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(
                buffer,
                file.name,
                `${pageId}/group_${group.id}`
            );

            // Create content record
            const { data: content, error: contentError } = await supabase
                .from(TABLES.CONTENT)
                .insert({
                    page_id: pageId,
                    file_name: file.name,
                    cloudinary_url: uploadResult.secureUrl,
                    cloudinary_public_id: uploadResult.publicId,
                    base_caption: caption, // For backward compatibility
                    individual_caption: caption,
                    group_id: group.id,
                    sort_order: i,
                    used_count: 0
                })
                .select()
                .single();

            if (contentError) {
                console.error(`Failed to save content ${i}:`, contentError);
                continue;
            }

            uploadedContents.push(content);
        }

        return NextResponse.json({
            success: true,
            group: {
                id: group.id,
                title: group.title,
                image_count: uploadedContents.length
            },
            contents: uploadedContents.map(c => ({
                id: c.id,
                file_name: c.file_name,
                cloudinary_url: c.cloudinary_url,
                individual_caption: c.individual_caption,
                sort_order: c.sort_order
            }))
        });

    } catch (error: any) {
        console.error('Multi-photo upload error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create multi-photo content'
        }, { status: 500 });
    }
}

// GET - List content groups for a page
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('page_id');
        const status = searchParams.get('status') || 'pending';

        if (!pageId) {
            return NextResponse.json({ error: 'page_id required' }, { status: 400 });
        }

        const { data: groups, error } = await supabase
            .from(TABLES.CONTENT_GROUPS)
            .select('*')
            .eq('page_id', pageId)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Get image count for each group
        const groupsWithCount = await Promise.all(
            (groups || []).map(async (group) => {
                const { count } = await supabase
                    .from(TABLES.CONTENT)
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);

                return {
                    ...group,
                    image_count: count || 0
                };
            })
        );

        return NextResponse.json({ groups: groupsWithCount });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
