import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        // Get the content first to get cloudinary_public_id
        const { data: content, error: fetchError } = await supabase
            .from(TABLES.CONTENT)
            .select('cloudinary_public_id')
            .eq('id', id)
            .single();

        if (fetchError || !content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // Delete from Cloudinary if exists
        if (content.cloudinary_public_id) {
            try {
                await deleteFromCloudinary(content.cloudinary_public_id);
            } catch (e) {
                console.error('Cloudinary delete error:', e);
                // Continue even if Cloudinary delete fails
            }
        }

        // Delete from Supabase
        const { error: deleteError } = await supabase
            .from(TABLES.CONTENT)
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete content error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to delete content'
        }, { status: 500 });
    }
}
