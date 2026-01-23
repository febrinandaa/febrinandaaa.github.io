import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pageId = searchParams.get('pageId');

        if (!pageId) {
            return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
        }

        // Query all content for the page
        const { data: items, error } = await supabase
            .from(TABLES.CONTENT)
            .select('*')
            .eq('page_id', pageId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ items: items || [] });

    } catch (error: any) {
        console.error('List content error:', error.message);
        return NextResponse.json({
            error: `Failed to fetch content: ${error.message}`
        }, { status: 500 });
    }
}
