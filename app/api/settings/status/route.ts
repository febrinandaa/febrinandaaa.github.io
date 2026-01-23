import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('key', 'systemEnabled')
            .single();

        return NextResponse.json({
            enabled: data?.value?.enabled ?? true
        });
    } catch {
        // If no setting exists, default to enabled
        return NextResponse.json({ enabled: true });
    }
}
