import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('key', 'stockConfig')
            .single();

        const config = data?.value || { interval: 1, duration: 30 };

        return NextResponse.json(config);
    } catch {
        return NextResponse.json({ interval: 1, duration: 30 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { interval, duration } = body;

        const { error } = await supabase
            .from(TABLES.SETTINGS)
            .upsert({
                key: 'stockConfig',
                value: { interval, duration }
            }, { onConflict: 'key' });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            config: { interval, duration }
        });
    } catch (error: any) {
        console.error('Config update error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
